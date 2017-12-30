import {Component, Inject, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {FormControl, Validators} from '@angular/forms';
import {IDevice, IDevicePropertyIn, IDevicePropertyBase} from '../services/device.service';
import {StorageService} from '../services/storage.service';
import {CacheService} from '../services/cache.service';
import {MqttService} from '../services/mqtt.service';
import {BaseComponent} from '../lib/base.component';
import {ZoneService} from '../services/zone.service';

interface IDevicePropertyExt extends IDevicePropertyBase {
  republish?: boolean;
  mapping?: string;
  value?: any;
  formControl?: FormControl;
}

@Component({
  selector: 'device-settings',
  templateUrl: './device-settings.dialog.html',
  styleUrls: ['./device-settings.dialog.scss']
})
export class DeviceSettingsDialog extends BaseComponent implements OnInit {

  public reported: IDevicePropertyExt[] = [];
  public desired: IDevicePropertyExt[] = [];
  public zones: string[];

  public model = {
    title: '',
    zone: '',
    republish: {},
    listen: {}
  };

  deviceTitleFC = new FormControl('', [Validators.required]);

  constructor(private storageService: StorageService,
              private cacheService: CacheService,
              private mqttService: MqttService,
              private zoneService: ZoneService,
              public dialogRef: MatDialogRef<DeviceSettingsDialog>,
              @Inject(MAT_DIALOG_DATA) public data: IDevice) {

    super();

    this.register(mqttService
      .on(`${data.device}/reported/+`)
      .subscribe(([topic, reported]) => {
        let [, , property] = topic.split('/');
        this.reported.forEach((prop: IDevicePropertyExt) => {
          if (prop.name === property) {
            prop.value = reported;
          }
        });
      }));
  }

  async ngOnInit(): Promise<void> {
    let [repub, listen, title, zone, zones] = await Promise.all([
      this.storageService.get(this.data.device, 'republish'),
      this.storageService.get(this.data.device, 'listen'),
      this.storageService.get<string>(this.data.device, 'title'),
      this.storageService.get<string>(this.data.device, 'zone'),
      this.zoneService.list(),
    ]);

    this.model.title = title;
    this.model.zone = zone;
    this.zones = zones;

    repub = repub || {};
    listen = listen || {};

    let metadata = this.data.manifest;

    let valuesP = metadata.mqtt.out.map(x => this.cacheService.get(this.data.device, x.name));
    valuesP.push(Promise.resolve(null));

    let values = await Promise.all(valuesP);
    this.reported = metadata.mqtt.out.map((x, index) => (<IDevicePropertyExt>{
      ...x,
      republish: repub.hasOwnProperty(x.name),
      mapping: repub[x.name] || x.name,
      value: values[index],
      formControl: new FormControl('', [Validators.required])
    }));

    this.desired = metadata.mqtt.in.map(x => (<IDevicePropertyExt>{
      ...x,
      republish: listen.hasOwnProperty(x.name),
      mapping: listen[x.name] || x.name,
      formControl: new FormControl('', [Validators.required])
    }));
  }

  buildSaveModel(): void {
    this.model.republish = this.reported.reduce((a, x: IDevicePropertyExt) => {
      if (x.republish) {
        a[x.name] = x.mapping;
      }
      return a;
    }, {});

    this.model.listen = this.desired.reduce((a, x: IDevicePropertyExt) => {
      if (x.republish) {
        a[x.name] = x.mapping;
      }
      return a;
    }, {});
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  getPropControl(property: IDevicePropertyIn): string {
    if (property.scale === 'timestamp') {
      return 'timestamp';
    }

    if (property.name.startsWith('battery') && property.scale === 'RYG') {
      return 'battery';
    }

    return 'default';
  }
}
