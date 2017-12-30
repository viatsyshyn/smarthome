import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { IStorageService } from './storage.service.d';
export * from './storage.service.d';

@Injectable()
export class StorageService implements IStorageService {

  constructor(
    private http: Http
  ) { }

  public settings<T>(device: string): Promise<T> {
    return this.http.get(`/api/storage/${device}`)
        .map(response => response.json())
        .toPromise();
  }

  public get<T = any>(device: string, key: string): Promise<T> {
    return this.http.get(`/api/storage/${device}/${key}`)
        .map(response => response.json())
        .toPromise();
  }

  public set<T = any>(device: string, key: string, value: T): Promise<T> {
    return this.http.put(`/api/storage/${device}/${key}`, value)
        .map(response => value)
        .toPromise();
  }
}
