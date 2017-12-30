export interface ICache {
    get<T = any>(key: string): Promise<T>;
    set<T = any>(key: string, value: T): Promise<T>;
}
