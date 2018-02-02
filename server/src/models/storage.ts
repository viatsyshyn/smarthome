export interface IDeviceSetting<T = any> {
  device: string;
  key: string;
  data: T;
}

export interface IEvent<T = any> {
  device: string;
  state: string;
  topic: string;
  property: string;
  timestamp: number;
  message: T;
}

export interface ITimestamped {
  timestamp: number;
}

export interface IStorage {
  set<T = any>(device: string, key: string, value: T): Promise<void>;
  get<T = any>(device: string, key: string, def?: T): Promise<T>;
  query<T = any>(device: string | undefined, key: string | undefined): Promise<IDeviceSetting<T>[]>;
  log<T = any>(event: IEvent<T>): Promise<void>;
  all(device: string): Promise<object>;
  stats<T extends ITimestamped>(device: string,
                                property: string | undefined,
                                since: Date,
                                till: Date,
                                interval: number,
                                props: any[]): Promise<T[]>;
  remove(device: string): Promise<void>;
}

export const ISTORAGE = Symbol.for('IStorage');
