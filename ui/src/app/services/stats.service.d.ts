
export interface IDeviceStat {
    timestamp: Date
}

export interface IStatsService {
    query<T extends IDeviceStat>(device: string, property: string | undefined, since: Date, till: Date, interval: number): Promise<T[]>;
}
