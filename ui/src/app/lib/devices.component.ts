import {OnDestroy, OnInit} from '@angular/core';

import {BaseComponent} from '../lib/base.component';
import {IScaleSettings, ISingleScaleSettings} from '../components/scale-set.component';

import {DeviceService, IDevice, IDevicePropertyOut, IDevicePropertyLambda} from '../services/device.service';
import {ZoneService} from '../services/zone.service';
import {MqttService} from '../services/mqtt.service';
import {CacheService} from '../services/cache.service';
import {StorageService} from '../services/storage.service';
import {StatsService, IDeviceStat} from '../services/stats.service';

const COLORS = ('d50000 f28a02 ffc107 ffd600 78bd0b 1d8e17 0091ea 0097a7' +
  ' 467d97 01579b 673ab7 c51162 880e4f ad1457 6a1b9a 4a148c' +
  ' 3f51b5 d500f9 00bcd4 00c853 2eb966 820404 f23502 075f76 ff6900'
)
  .split(' ')
  .map(x => '#' + x)
  .reverse();

interface IDeviceComplex extends IDevice {
  initialized: boolean;
  lastUpdated: Date;
  scales: IScaleSettings[];
}

interface IZoneComplex {
  zone: string;
  color: string;
}

interface ITimestamped {
  timestamp: number;
}

interface IDeviceRuntime {
  getProperty<T = any>(key: string): Promise<T>;
  getSetting<T = any>(key: string): Promise<T>;
  queryStats<T extends IDeviceStat>(property: string | undefined,
                                    since: number | Date,
                                    till?: number | Date,
                                    interval?: number): Promise<T[]>
}

export class BaseDevicesComponent extends BaseComponent implements OnInit, OnDestroy {

  public devices: IDeviceComplex[];
  public zones: IZoneComplex[];

  protected widget: 'icon' | 'devices' = 'icon';
  private timer: any = null;

  constructor(protected deviceService: DeviceService,
              protected zoneService: ZoneService,
              protected mqttService: MqttService,
              protected cacheService: CacheService,
              protected storageService: StorageService,
              protected statsService: StatsService,
              ) {
    super();

    this.register(mqttService
      .on('+/reported/+')
      .subscribe(([topic, payload]) => {
        const [device, , property] = topic.split('/');

        this.devices.forEach((d) => {
          if (device === d.device) {
            d.initialized = true;
            d.lastUpdated = new Date();
            this.updateStatus(d);

            d.scales.forEach((p) => {
              if (property === p.prime.name) {
                p.prime.value = payload;
                if (p.secondary) {
                  this.updateValue(device, p.secondary);
                }
              }

              if (p.secondary && property === p.secondary.name) {
                p.secondary.value = payload;
                if (p.prime) {
                  this.updateValue(device, p.prime);
                }
              }

              if (p.state && property === p.state.name) {
                p.state.value = payload;
                if (p.prime) {
                  this.updateValue(device, p.prime);
                }
                if (p.secondary) {
                  this.updateValue(device, p.secondary);
                }
              }
            })
          }
        })
      }));
  }

  public ngOnDestroy() {
    super.ngOnDestroy();
    clearTimeout(this.timer);
  }

  public async ngOnInit(): Promise<void> {
    const [devices, zones] = await Promise.all([
      this.deviceService.list(),
      this.zoneService.list(),
    ]);

    this.zones = zones.map((zone, index) => ({
      zone,
      color: COLORS[index]
    }));

    this.devices = devices.map((device: IDevice) => {
      let r = {
        ...device,
        initialized: false,
        lastUpdated: undefined,
        scales: device.manifest.ui[this.widget].map(widget => ({
          state: this.getScale(device, widget.state),
          prime: this.getScale(device, widget.prime),
          secondary: this.getScale(device, widget.secondary),
        }))
      } as IDeviceComplex;

      this.cacheService.get(device.device, 'last-updated')
        .then(v => {
          if (v) {
            r.lastUpdated = new Date(v);
            r.initialized = true;
            this.updateStatus(r);
          }
        });

      return r;
    });

    this.timer = setInterval(() => this.devices.forEach(d => this.updateStatus(d)), 1000);
  }

  private getScale(device: IDevice, scale: string | IDevicePropertyLambda): ISingleScaleSettings {
    if (scale === undefined) {
      return undefined;
    }

    if (typeof scale === 'string') {
      scale = {
        ...device.manifest.mqtt.out.find(x => x.name === scale),
        lambda: undefined
      };
    }

    const d: ISingleScaleSettings = {
      name: scale.name,
      precision: scale.precision,
      scale: scale.scale,
      sign: scale.sign,
      value: undefined,
      lambda: scale.lambda
    };

    this.updateValue(device.device, d, true);

    return d;
  }

  private updateStatus(d: IDeviceComplex): void {
    if (d.initialized && d.lastUpdated) {
      const last = d.lastUpdated instanceof Date
        ? (d.lastUpdated as Date).getTime()
        : d.lastUpdated;
      const now = new Date().getTime();
      if (now - last > d.manifest.mqtt.idlePeriodSec * 1000) {
        d.initialized = false;
      }
    }
  }

  private updateValue(device: string, d: ISingleScaleSettings, cached = false): void {
    if (typeof d.lambda === 'string') {
      this._eval(device, d.lambda)
        .then(v => d.value = v);
    } else if (cached) {
      this.cacheService.get(device, d.name)
        .then(v => d.value = v);
    }
  }

  private _eval<R = any>(device: string, code: string): Promise<R> {
    const getDate = (date: number | Date | undefined): Date => {
      if (typeof date === 'number') {
        return new Date(new Date().getTime() + date * 1000);
      }
      if (date instanceof Date) {
        return date;
      }
      return new Date();
    };

    return new Promise<R>((resolve, reject) => {
      const api = {
        resolve,
        runtime: <IDeviceRuntime>{
          getProperty: <T = any>(key: string): Promise<T> => this.cacheService.get(device, key),
          getSetting: <T = any>(key: string): Promise<T> => this.storageService.get(device, key),
          queryStats: <T extends IDeviceStat>(property: string | undefined,
                                              since: number | Date,
                                              till?: number | Date,
                                              interval = 60): Promise<T[]> =>
            this.statsService.query(device, property, getDate(since), getDate(till), interval)
        }
      };

      new Function('api', `(${code})(api.runtime).then(api.resolve)`)(api);
    });
  }
}
