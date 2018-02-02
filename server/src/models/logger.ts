export interface ILogger {
    log(...args: any[]): void;
    info(...args: any[]): void;
    error(...args: any[]): void;
}

export type ILoggerFactory = (ns: string) => ILogger;

export const ILOGGERFACTORY = Symbol.for('ILoggerFactory');
