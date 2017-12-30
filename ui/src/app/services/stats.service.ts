import { Injectable } from '@angular/core';
import { Http, URLSearchParams } from '@angular/http';
import { IStatsService, IDeviceStat } from './stats.service.d';
export * from './stats.service.d';

@Injectable()
export class StatsService implements IStatsService {

  constructor(
    private http: Http
  ) { }

  public async query<T extends IDeviceStat>(device: string,
                                            property: string | undefined,
                                            since: Date,
                                            till: Date,
                                            interval: number): Promise<T[]> {
    let params: URLSearchParams = new URLSearchParams();
    params.set('since', since.toISOString());
    params.set('till', till.toISOString());
    params.set('interval', String(interval));

    const data: T[] = await this.http.get(`/api/history/${device}/${property || ''}`, { search: params, withCredentials: true })
        .map(response => response.json())
        .toPromise();

    return data.map((stat: T): T => {
        stat.timestamp = stat.timestamp instanceof Date ? stat.timestamp : new Date(stat.timestamp);
        return stat;
    })
  }
}
