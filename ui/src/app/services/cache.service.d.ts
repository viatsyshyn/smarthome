export interface ICacheService {
  get<T = any>(device: string, key: string): Promise<T>;
}
