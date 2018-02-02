import { injectable, inject } from 'inversify';
import Redis = require('redis');
import {ILogger, ILoggerFactory, ILOGGERFACTORY, ICache} from '../models';

export const REDIS = Symbol.for('Redis');

@injectable()
export class Cache implements ICache {
  private logger: ILogger;

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(REDIS) private redis: Redis.RedisClient
  ) {
    this.logger = factory('cache');
  }

  async get<T = any>(key: string, def: T = null): Promise<T> {
    this.logger.log(`Get ${key}`);
    return new Promise<T>((resolve, reject) => {
      this.redis.get(key, (err, value) => {
        this.logger.log(`Get ${key} ${err || value}`);
        err ? reject(err) : resolve(JSON.parse(value) || def);
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
}
