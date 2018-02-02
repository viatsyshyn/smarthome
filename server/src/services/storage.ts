import { injectable, inject } from 'inversify';
import MongodbClient = require('mongodb');
import {IDeviceSetting, IEvent, ILogger, ILoggerFactory, ILOGGERFACTORY, IStorage, ITimestamped} from '../models';

import _ = require('lodash');

export const MONGODB = Symbol.for('MongoDB');

const SETTINGS = 'settings';
const EVENTS = 'events';

function query(q: any): any {
  for (let key of Object.keys(q)) {
    if (q[key] === undefined) {
      delete q[key];
    }
  }

  return q;
}

@injectable()
export class Storage implements IStorage {
  private logger: ILogger;

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(MONGODB) private db: MongodbClient.Db
  ) {
    this.logger = factory('storage');
  }

  async remove(device: string): Promise<void> {
    await this.db.collection(SETTINGS)
      .deleteMany(query({device}));

    return;
  }

  async set<T = any>(device: string, key: string, data: T): Promise<void> {
    this.logger.log(`Set ${device}::${key} = ${JSON.stringify(data)}`);

    if (data === undefined) {
      await this.db.collection(SETTINGS)
        .deleteOne(query({device, key}));

      return;
    }

    await this.db
      .collection(SETTINGS)
      .updateOne(
        query({device, key}),
        {device, key, data},
        {upsert: true});
  }

  async get<T = any>(device: string, key: string, def: T = null): Promise<T | null> {
    let data: IDeviceSetting<T> = await this.db
      .collection(SETTINGS)
      .findOne(query({device, key}));

    this.logger.log(`Get ${device}::${key} = ${JSON.stringify(data)}`);

    return data ? data.data : def;
  }

  async query<T = any>(device: string | undefined, key: string | undefined): Promise<IDeviceSetting<T>[]> {
    let results = await this.db
      .collection(SETTINGS)
      .find(query({device, key}))
      .toArray();

    this.logger.log(`Get ${device}::${key} = ${JSON.stringify(results)}`);

    return results;
  }

  async log<T = any>(event: IEvent<T>): Promise<void> {
    this.logger.log(`Log ${JSON.stringify(event)}`);
    await this.db
      .collection(EVENTS)
      .insertOne(event);
  }

  async all(device: string): Promise<object> {
    let data = await this.query(device, undefined);
    return data.reduce((x: any, a: IDeviceSetting) => {
      x[a.key] = a.data;
      return x;
    }, {});
  }

  async stats<T extends ITimestamped>(device: string,
                                      property: string | undefined,
                                      since: Date,
                                      till: Date,
                                      interval: number,
                                      props: any[]): Promise<T[]> {
    const data: IEvent<T>[] = await this.db
      .collection(EVENTS)
      .find(query({
        state: 'reported',
        property,
        device,
        timestamp: {$gt: since.getTime() - interval * 1000, $lt: till.getTime()}
      }))
      .toArray() as IEvent<T>[];

    data.sort((a: IEvent, b: IEvent): number => a.timestamp - b.timestamp);

    if (interval <= 60) {
      return data
        .map((x: IEvent): T => (<T>{
          timestamp: x.timestamp,
          [x.property]: x.message
        })) as T[];
    }

    const state: any = {};
    const results: T[] = [];
    let end: number = since.getTime();
    while (end <= till.getTime()) {
      const start: number = end - interval * 1000;
      const available: IEvent<T>[] = data.filter((x: IEvent) => x.timestamp > start && x.timestamp <= end);

      for (let prop of props) {
        if (prop.scale === 'timestamp') {
          continue;
        }

        const accumulated: any[] = [];
        for (let reported of available) {
          if ((reported as IEvent).property !== prop.name) {
            continue;
          }

          const reported_value: any = (reported as IEvent).message;
          if (reported_value != null) {
            accumulated.push(reported_value);
          }
        }

        if (accumulated.length === 0) {
          state[prop.name] = null;
          continue;
        }

        switch (prop.scale) {
          case 'bit':
            state[prop.name] = _.sum(accumulated);
            break;
          case 'RYB':
            state[prop.name] = _.last(accumulated);
            break;
          default:
            state[prop.name] = _.sum(accumulated) / accumulated.length;
        }
      }

      results.push({
        timestamp: end,
        ...state
      } as T);

      end += interval * 1000;
    }

    return results;
  }
}
