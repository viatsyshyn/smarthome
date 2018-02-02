import { injectable, inject } from 'inversify';
import {
  ICache, ICACHE, IDeviceSetting, ILogger, ILoggerFactory, ILOGGERFACTORY, IPubSub, IPUBSUB, IStorage,
  ISTORAGE, ITimestamped
} from '../models';
import {setInterval} from 'timers';
import Timer = NodeJS.Timer;
import {IEVALUATOR, IEvaluator} from './evalutor';
const parser = require('cron-parser');

export interface IWorker {
  start(): Promise<void>;
}

export const IWORKER = Symbol.for('IWorker');

function parseIfString(x: any): any {
  return typeof x === 'string' ? JSON.parse(x) : x;
}

@injectable()
export class Worker implements IWorker {
  private logger: ILogger;
  private manifests = new Map<String, any>();
  private lastScheduleTick = 0;
  private timer: Timer;

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(ISTORAGE) private storage: IStorage,
    @inject(ICACHE) private cache: ICache,
    @inject(IPUBSUB) private pubsub: IPubSub,
    @inject(IEVALUATOR) private evaluator: IEvaluator
  ) {
    this.logger = factory('worker');
  }

  public async start(): Promise<void> {
    let zones = (await this.storage.get<string[]>('*', 'zones')) || [];
    if (zones.indexOf('General') < 0) {
      zones.unshift('General');
      await this.storage.set('*', 'zones', zones);
    }

    (await this.storage.query(undefined, 'manifest'))
      .forEach(x => this.manifests.set(x.device, x.data));

    this.lastScheduleTick = await this.cache.get(`scheduler::last-tick`, new Date().getTime() - 4 * 3600000);

    this.pubsub.sub('+/manifest', this.onManifest.bind(this));
    this.pubsub.sub('+/reported/+', this.onReported.bind(this));
    this.pubsub.sub('+/desired/+', this.onDesired.bind(this));
    this.pubsub.sub('+/updated/+', this.onUpdated.bind(this));

    this.timer = setInterval(this.onTick.bind(this), 15000);
    await this.onTick();
  }

  private async onManifest(msg: any, topic: string): Promise<void> {
    this.logger.log(topic, msg);

    let [id] = topic.split('/');
    await Promise.all([
      this.storage.set(id, 'manifest', msg),
      this.cache.set(`${id}::last-updated`, new Date().getTime())
    ]);

    this.manifests.set(id, msg);

    const zone = await this.storage.get(id, 'zone', 'General');
    const title = await this.storage.get(id, 'title', `${msg.device} in ${zone}`);

    await Promise.all([
      this.storage.set(id, 'title', title),
      this.storage.set(id, 'zone', zone),
    ]);
  }

  private async onReported(msg: any, topic: string): Promise<void> {
    this.logger.log(topic, msg);

    const now = new Date().getTime();

    let [device, state, property] = topic.split('/');
    await this.cache.set(`${device}::${property}`, msg);
    await this.cache.set(`${device}::last-updated`, now);

    await this.storage.log({
      timestamp: now,
      device,
      state,
      topic,
      property,
      message: msg
    });

    let zone = await this.storage.get(device, 'zone');
    if (zone != null) {
      this.logger.log(`Processing device "${device}" republish`);

      let republish: any = await this.storage.get(device, 'republish');
      if (republish && republish.hasOwnProperty(property)) {
        this.pubsub.pub(`${zone}/updated/${republish[property]}`, msg);
      }
    }

    if (this.manifests.has(device)) {
      const manifest = this.manifests.get(device);
      const prop = manifest.mqtt.out.find((x: any) => x.name === property);
      if (prop && prop.lambda) {
        await this.evaluator.eval(device, prop.lambda, msg);
      }
    }
  }

  private async onDesired(msg: any, topic: string): Promise<void> {
    this.logger.log(topic, msg);

    let [device, state, property] = topic.split('/');

    await this.storage.log({
      timestamp: new Date().getTime(),
      device,
      state,
      topic,
      property,
      message: msg
    });

    if (this.manifests.has(device)) {
      const manifest = this.manifests.get(device);
      const prop = manifest.mqtt.in.find((x: any) => x.name === property);
      if (prop && prop.virtual) {
        this.pubsub.pub(`${device}/reported/${property}`, msg);
      }
    }
  }

  private async onUpdated(msg: any, topic: string): Promise<void> {
    let [zone, , property] = topic.split('/');

    this.logger.log(`Processing zone "${zone}" listeners`);

    const [ devicesZones, listen ] = await Promise.all([
      this.storage.query(undefined, 'zone'),
      this.storage.query(undefined, 'listen')
    ]);

    devicesZones
      .filter((x: IDeviceSetting) => x.data === zone)
      .map((x: IDeviceSetting) => x.device)
      .map((device) => {
        let listen_settings: any = (listen.find((x: IDeviceSetting) => x.device === device) || {data: {}}).data || {};
        Object.keys(listen_settings)
          .forEach((key: string) => {
            if (property === listen_settings[key]) {
              this.pubsub.pub(`${device}/desired/${key}`, msg);
            }
          });
      });
  }

  private async onTick(): Promise<void> {
    const thisScheduleTick = new Date().getTime() - 1;
    const cronOptions = {
      currentDate: new Date(thisScheduleTick),
      tz: 'Europe/Kiev'
    };

    let queue: {
      timestamp: number;
      device: string;
      property: string;
      value: any;
    }[] = [];

    const schedules = await this.storage.query(undefined, 'schedule');
    schedules.forEach((setting) => {
      const deviceSchedule = parseIfString(setting.data);

      Object.keys(deviceSchedule).forEach((property: string) => {
        const propertySchedule = parseIfString(deviceSchedule[property]);

        Object.keys(propertySchedule).forEach((timer: string) => {
          const interval = parser.parseExpression(timer, cronOptions);
          const value = propertySchedule[timer];

          queue.push({
            timestamp: interval.prev().getTime(),
            device: setting.device,
            property,
            value
          });
        });
      });
    });

    queue = queue.filter(x => x.timestamp >= this.lastScheduleTick);
    queue.sort((_1, _2) => _1.timestamp - _2.timestamp);

    this.logger.info(`processing ${queue.length} events since ${new Date(this.lastScheduleTick)}`);

    queue
      .forEach(item => {
        this.pubsub.pub(`${item.device}/desired/${item.property}`, item.value);
      });

    this.lastScheduleTick = await this.cache.set(`scheduler::last-tick`, thisScheduleTick);
  }
}
