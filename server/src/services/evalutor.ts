import {inject, injectable} from 'inversify';
import {
  ICache, ICACHE, ILogger, ILoggerFactory, ILOGGERFACTORY, IPubSub, IPUBSUB, IStorage, ISTORAGE,
  ITimestamped
} from '../models';

const _eval = require('node-eval');

export interface IEvaluator {
  eval<T = void>(device: string, lambda: string, value: any): Promise<T>;
}

export const IEVALUATOR = Symbol.for('IEvaluator');

interface IDeviceRuntime {
  getProperty<T = any>(key: string): Promise<T>;
  setProperty<T = any>(key: string, value: T): Promise<T>;
  getSetting<T = any>(key: string): Promise<T>;
  setSetting<T = any>(key: string, value: T): Promise<void>;
  queryStats<T = any>(property: string | undefined, since: number | Date, till?: number | Date, interval?: number): Promise<ITimestamped[]>;
  publish<T = any>(t: string, value: T): void;
}

function getDate(date: number | Date | undefined): Date {
  if (typeof date === 'number') {
    return new Date(new Date().getTime() + date * 1000);
  }
  if (date instanceof Date) {
    return date;
  }
  return new Date();
}

@injectable()
export class Evaluator implements IEvaluator {
  private logger: ILogger;

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(ICACHE) private cache: ICache,
    @inject(ISTORAGE) private storage: IStorage,
    @inject(IPUBSUB) private pubsub: IPubSub
  ) {
    this.logger = factory('evaluator');
  }

  public async eval<X = any>(device: string, lambda: string, msg: any): Promise<X> {
    this.logger.log('LAMBDA: ', lambda);

    const manifest = await this.storage.get<any>(device, 'manifest');

    const runtime: IDeviceRuntime = {
      getProperty: <T = any>(key: string): Promise<T> => this.cache.get(`${device}::${key}`),
      setProperty: <T = any>(key: string, value: T): Promise<T> => this.cache.set(`${device}::${key}`, value),
      getSetting: <T = any>(key: string): Promise<T> => this.storage.get(device, key),
      setSetting: <T = any>(key: string, value: T): Promise<void> => this.storage.set<T>(device, key, value),
      queryStats: <T = any>(p: string | undefined,
                            since: number | Date,
                            till?: number | Date,
                            interval = 60): Promise<ITimestamped[]> =>
        this.storage.stats(device, p, getDate(since), getDate(till), interval, manifest.mqtt.out),
      publish: <T = any>(t: string, value: T): void => (this.pubsub.pub(`${device}/${t}`, value), null)
    };

    let r = _eval(`module.exports = ((${lambda})(runtime, value));`, `/lambdas/${device}`, { runtime, value: msg});
    this.logger.log('result: ', r);
    if (r instanceof Promise) {
      this.logger.log('await: ', r);
      r = await (r as Promise<any>);
      this.logger.log('awaited: ', r);
    }

    return r;
  }
}
