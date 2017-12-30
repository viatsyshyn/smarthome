export interface IPubSub {
    id(): string;
    sub<T = any>(topic: string, cb: (msg: T) => void): void;
    pub<T = any>(topic: string, msg: T): void;
}
