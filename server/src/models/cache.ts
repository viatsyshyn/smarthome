export interface ICache {
  get<T = any>(key: string, def?: T): Promise<T>;
  set<T = any>(key: string, value: T): Promise<T>;
}

export const ICACHE = Symbol.for('ICache');
