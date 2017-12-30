export interface IStorageService {
  settings<T>(device: string): Promise<T>;
  get<T = any>(device: string, key: string): Promise<T>;
  set<T = any>(device: string, key: string, value: T): Promise<T>;
}
