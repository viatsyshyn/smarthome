import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { IZoneService } from './zone.service.d';
export * from './zone.service.d';

@Injectable()
export class ZoneService implements IZoneService {

  constructor(
    private http: Http
  ) { }

  public list(): Promise<string[]> {
    return this.http.get(`/api/zones`)
        .map(response => response.json())
        .toPromise();
  }

  public add(zone: string): Promise<string[]> {
    return this.http.put(`/api/zone/${zone}`, {name: zone})
        .map(response => response.json())
        .toPromise();
  }

  public remove(zone: string): Promise<string[]> {
    return this.http.delete(`/api/zone/${zone}`)
        .map(response => response.json())
        .toPromise();
  }
}
