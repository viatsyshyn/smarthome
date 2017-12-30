import {ILogger} from '../models';

export function LoggerFactory(ns: string): ILogger {
  return <ILogger>{
    log(...args: any[]) {
      console.log(`${ns}:log`, ...args);
    },
    info(...args: any[]) {
      console.log(`${ns}:info`, ...args);
    },
    error(...args: any[]) {
      console.error(`${ns}:error`, ...args);
    }
  };
}
