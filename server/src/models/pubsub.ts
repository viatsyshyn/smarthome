export type TMessageHandler<T = any> = (msg: T, topic: string) => void;

export interface IPubSub {
  sub<T = any>(topic: string, cb: TMessageHandler<T>): IPubSub;
  pub<T = any>(topic: string, msg: T): IPubSub;
}

export const IPUBSUB = Symbol.for('IPubSub');
