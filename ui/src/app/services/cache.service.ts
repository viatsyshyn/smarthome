import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { ICacheService } from './cache.service.d';
export * from './cache.service.d';

@Injectable()
export class CacheService implements ICacheService {

  constructor(
    private http: Http
  ) { }

  public get<T = any>(device: string, key: string): Promise<T> {
    return this.http.get(`/api/cached/${device}/${key}`)
        .map(response => response.json())
        .toPromise();
  }
}
