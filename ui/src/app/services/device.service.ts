import { Injectable } from '@angular/core';
import { Http } from '@angular/http';
import { IDeviceService, IDevice } from './device.service.d';
export * from './device.service.d';

@Injectable()
export class DeviceService implements IDeviceService {

  constructor(
    private http: Http
  ) { }

  public list(): Promise<IDevice[]> {
    return this.http.get(`/api/devices`)
        .map(response => response.json())
        .toPromise();
  }

  public forget(device: string): Promise<void> {
    return this
      .http.delete(`/api/device/${device}`)
      .map(response => null)
      .toPromise();
  }
}
