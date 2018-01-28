import {Component, OnInit} from '@angular/core';
import {MatChipInputEvent, MatDialog, MatDialogConfig} from '@angular/material';
import {ENTER} from '@angular/cdk/keycodes';

import {BaseDevicesComponent} from '../lib/devices.component';

import {MqttService} from '../services/mqtt.service';
import {StorageService} from '../services/storage.service';
import {DeviceService, IDevice} from '../services/device.service';
import {ZoneService} from '../services/zone.service';
import {CacheService} from '../services/cache.service';
import {StatsService} from '../services/stats.service';

import {DeviceSettingsDialog} from './device-settings.dialog';
import {DeviceStatsDialog} from './device-stats.dialog';

const COMMA = 188;
const COLORS = ('d50000 f28a02 ffc107 ffd600 78bd0b 1d8e17 0091ea 0097a7' +
  ' 467d97 01579b 673ab7 c51162 880e4f ad1457 6a1b9a 4a148c' +
  ' 3f51b5 d500f9 00bcd4 00c853 2eb966 820404 f23502 075f76 ff6900'
)
  .split(' ')
  .map(x => '#' + x)
  .reverse();

interface IDeviceComplex extends IDevice {
  identify?: boolean | undefined;
}

interface IZoneComplex {
  zone: string;
  color: string;
}

@Component({
  templateUrl: './devices.component.html',
  styleUrls: ['./devices.component.scss']
})
export class DevicesComponent extends BaseDevicesComponent {

  // Enter, comma
  public separatorKeysCodes = [ENTER, COMMA];

  constructor(deviceService: DeviceService,
              zoneService: ZoneService,
              mqttService: MqttService,
              cacheService: CacheService,
              storageService: StorageService,
              statsService: StatsService,
              public dialog: MatDialog) {
    super(
      deviceService,
      zoneService,
      mqttService,
      cacheService,
      storageService,
      statsService
      );

    this.widget = 'devices';
  }

  addZone(event: MatChipInputEvent): void {
    let input = event.input;
    let value = (event.value || '').trim();

    // Add our person
    if (value && !this.zones.some(x => x.zone === value)) {
      this.zones.push({zone: value, color: COLORS[this.zones.length]});
      this.zoneService.add(value);
    }

    // Reset the input value
    if (input) {
      input.value = '';
    }
  }

  removeZone(zone: IZoneComplex): void {
    if (this.zones.indexOf(zone) >= 0) {
      this.zones = this.zones.filter(x => x.zone !== zone.zone);
      this.zoneService.remove(zone.zone);
    }
  }

  configureDevice(device: IDevice): void {
    let dialogRef = this.dialog.open(DeviceSettingsDialog, <MatDialogConfig>{
      width: '50vw',
      data: device
    });

    dialogRef.afterClosed().subscribe(results => {
      if (results === null) {
        this.devices = this.devices.filter(x => x.device !== device.device);
        this.deviceService.forget(device.device);
        return;
      }

      this.storageService.set(device.device, 'title', results.title);
      this.storageService.set(device.device, 'republish', results.republish);
      this.storageService.set(device.device, 'listen', results.listen);
      this.storageService.set(device.device, 'schedule', results.schedule);
      this.storageService.set(device.device, 'zone', results.zone);

      Object.keys(results.values).forEach(key => {
        this.mqttService.pub(`${device.device}/desired/${key}`, results.values[key]);
      });
    })
  }

  deviceStats(device: IDevice): void {
    let dialogRef = this.dialog.open(DeviceStatsDialog, <MatDialogConfig>{
      width: '90vw',
      data: device
    });
  }
}
