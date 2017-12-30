import {LoggerFactory} from './services/logger';
import cache from './services/cache';
import storage, {IDeviceSetting, ITimestamped} from './services/storage';
import pubsub from './services/pubsub';

const _eval = require('node-eval');

const logger = LoggerFactory('server');

logger.log('Smarthome server starting...');

interface IDeviceRuntime {
  getProperty<T = any>(key: string): Promise<T>;
  setProperty<T = any>(key: string, value: T): Promise<T>;
  getSetting<T = any>(key: string): Promise<T>;
  setSetting<T = any>(key: string, value: T): Promise<void>;
  queryStats<T = any>(property: string | undefined, since: number | Date, till?: number | Date, interval?: number): Promise<ITimestamped[]>
}

async function main() {
  logger.info('Initializing connections');

  await Promise.all([
    cache.init(process.env.CACHE, LoggerFactory('cache')),
    storage.init(process.env.STORAGE, LoggerFactory('storage')),
    pubsub.init(process.env.PUBSUB, LoggerFactory('pubsub'))
  ]);

  logger.info('Initializing devices');

  let zones = (await storage.get<string[]>('*', 'zones')) || [];
  if (zones.indexOf('General') < 0) {
    zones.unshift('General');
    await storage.set('*', 'zones', zones);
  }

  let manifests = (await storage.query(undefined, 'manifest'))
    .reduce((a, x) => a[x.device] = x.data, <any>{});

  pubsub.sub('+/manifest', async (msg: any, topic) => {
    logger.log(topic, msg);

    let [id] = topic.split('/');
    await storage.set(id, 'manifest', msg);
    await cache.set(`${id}::last-updated`, new Date().getTime());

    manifests[id] = msg;

    const zone = await storage.get(id, 'zone') || 'General';
    const title = await storage.get(id, 'title') || `${msg.device} in ${zone}`;

    await Promise.all([
      storage.set(id, 'title', title),
      storage.set(id, 'zone', zone),
    ]);
  });

  pubsub.sub('+/reported/+', async (msg, topic) => {
    logger.log(topic, msg);

    let [device, state, property] = topic.split('/');
    await cache.set(`${device}::${property}`, msg);
    await cache.set(`${device}::last-updated`, new Date().getTime());

    await storage.log({
      timestamp: new Date().getTime(),
      device,
      state,
      topic,
      property,
      message: msg
    });

    if (manifests.hasOwnProperty(device)) {
      const prop = manifests[device].mqtt.out.find((x: any) => x.name === property);
      if (prop && prop.lambda) {
        logger.log('LAMBDA: ', prop.lambda);
        const getDate = (date: number | Date | undefined): Date => {
          if (typeof date === 'number') {
            return new Date(new Date().getTime() + date * 1000);
          }
          if (date instanceof Date) {
            return date;
          }
          return new Date();
        };
        const runtime: IDeviceRuntime = {
          getProperty: <T = any>(key: string): Promise<T> => cache.get(`${device}::${key}`),
          setProperty: <T = any>(key: string, value: T): Promise<T> => cache.set(`${device}::${key}`, value),
          getSetting: <T = any>(key: string): Promise<T> => storage.get(device, key),
          setSetting: <T = any>(key: string, value: T): Promise<void> => storage.set<T>(device, key, value),
          queryStats: <T = any>(p: string | undefined,
                                since: number | Date,
                                till?: number | Date,
                                interval = 60): Promise<ITimestamped[]> =>
            storage.stats(device, p, getDate(since), getDate(till), interval, manifests[device].mqtt.out)
        };

        let r = _eval(`module.exports = ((${prop.lambda})(runtime, value));`, `/lambdas/${device}/${property}`, { runtime, value: msg});
        logger.log('result: ', r);
        if (r instanceof Promise) {
          logger.log('await: ', r);
          r = await (r as Promise<any>);
          logger.log('awaited: ', r);
        }
      }
    }
  });

  pubsub.sub('+/reported/+', async (msg: any, topic: string) => {
    let [device, , property] = topic.split('/');

    let zone = await storage.get(device, 'zone');
    if (zone == null) {
      return;
    }

    logger.log(`Processing device "${device}" republish`);

    let republish: any = await storage.get(device, 'republish');
    if (republish && republish.hasOwnProperty(property)) {
      pubsub.pub(`${zone}/updated/${republish[property]}`, msg);
    }
  });

  pubsub.sub('+/updated/+', async (msg: any, topic: string) => {
    let [zone, , property] = topic.split('/');

    logger.log(`Processing zone "${zone}" listeners`);

    let device_zone = (await storage.query(undefined, 'zone'))
      .reduce((a: any, x: IDeviceSetting): any => ((a[x.device] = x.data), a), {});

    await Promise.all(Object.keys(device_zone)
      .filter(x => device_zone[x] === zone)
      .map(async (to_device) => {
        let listen_map: any = await storage.get(to_device, 'listen');
        if (listen_map) {
          Object.keys(listen_map)
            .forEach((key: string) => {
              if (property === listen_map[key]) {
                pubsub.pub(`${to_device}/desired/${key}`, msg);
              }
            });
        }
      }));
  });

  logger.info('Initialized');
}

main().catch(logger.error);
