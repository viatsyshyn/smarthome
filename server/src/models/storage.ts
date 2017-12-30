export interface IStorage {
    set<T = any>(key: string, value: T): Promise<void>;
    get<T = any>(key: string): Promise<T>;
    all(): Promise<object>;
}
