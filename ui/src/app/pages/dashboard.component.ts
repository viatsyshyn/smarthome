import {Component} from '@angular/core';

import {BaseDevicesComponent} from '../lib/devices.component';

import {DeviceService} from '../services/device.service';
import {ZoneService} from '../services/zone.service';
import {MqttService} from '../services/mqtt.service';
import {CacheService} from '../services/cache.service';
import {StorageService} from '../services/storage.service';
import {StatsService} from '../services/stats.service';

@Component({
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent extends BaseDevicesComponent {

  constructor(deviceService: DeviceService,
              zoneService: ZoneService,
              mqttService: MqttService,
              cacheService: CacheService,
              storageService: StorageService,
              statsService: StatsService
              ) {
    super(
      deviceService,
      zoneService,
      mqttService,
      cacheService,
      storageService,
      statsService
    );
  }
}
