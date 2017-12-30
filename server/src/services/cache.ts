import Redis = require('redis');
import {ILogger, ICache} from '../models';

export class Cache {
  private redis: Redis.RedisClient;
  private logger: ILogger;

  async init(url: string, logger: ILogger): Promise<void> {
    this.logger = logger;
    logger.log(`Connecting to ${url}`);
    return new Promise<void>((resolve, reject) => {
      this.redis = Redis
        .createClient(url)
        .on('connect', () => {
          logger.info(`Initialized`);
          resolve();
        });
    });
  }

  async get<T = any>(key: string): Promise<T> {
    this.logger.log(`Get ${key}`);
    return new Promise<T>((resolve, reject) => {
      this.redis.get(key, (err, value) => {
        this.logger.log(`Get ${key} ${err || value}`);
        err ? reject(err) : resolve(JSON.parse(value));
      });
    });
  }

  async set<T = any>(key: string, value: T): Promise<T> {
    this.logger.log(`Set ${key}`);
    return new Promise<T>((resolve, reject) => {
      this.redis.set(key, JSON.stringify(value), (err) => {
        this.logger.log(`Set ${key} ${err || value}`);
        err ? reject(err) : resolve(value);
      });
    });
  }

  getDeviceCache(device: string): ICache {
    return <ICache>{
      get: <T = any>(key: string): Promise<T> => this.get<T>(`${device}::${key}`),
      set: <T = any>(key: string, value: T): Promise<T> => this.set<T>(`${device}::${key}`, value)
    };
  }
}

const cache = new Cache();
export default cache;
