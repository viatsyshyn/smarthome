import {Component, ElementRef, Inject, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef, MatTabChangeEvent} from '@angular/material';
import {IDevice, IManifest, IDevicePropertyOut} from '../services/device.service';
import {StatsService, IDeviceStat} from '../services/stats.service';
import {MqttService} from '../services/mqtt.service';
import {BaseComponent} from '../lib/base.component';

declare let Chart: any;

const COLORS = ('d50000 f28a02 ffc107 ffd600 78bd0b 1d8e17 0091ea 0097a7' +
  ' 467d97 01579b 673ab7 c51162 880e4f ad1457 6a1b9a 4a148c' +
  ' 3f51b5 d500f9 00bcd4 00c853 2eb966 820404 f23502 075f76 ff6900'
)
  .split(' ')
  .map(x => '#' + x)
  .reverse();

const CHART_COLORS = COLORS
  .map(x => [
    parseInt(x.substr(1, 2), 16),
    parseInt(x.substr(3, 2), 16),
    parseInt(x.substr(5, 2), 16),
  ].join(','))
  .map(color => ({ // grey
    backgroundColor: `rgba(${color},0.2)`,
    borderColor: `rgba(${color},1)`,
    pointBackgroundColor: `rgba(${color},1)`,
    pointHoverBorderColor: `rgba(${color},0.8)`
  }));

@Component({
  selector: 'device-stats',
  templateUrl: './device-stats.dialog.html',
  styleUrls: ['./device-stats.dialog.scss']
})
export class DeviceStatsDialog extends BaseComponent implements OnInit, OnDestroy {

  public since = new Date(new Date().getTime() - 60 * 60 * 1000);
  public till = new Date(new Date().getTime() + 60 * 1000);
  public interval = 60;

  private metadata: IManifest;
  private stats: IDeviceStat[] = [];

  private ctx: any = null;
  private chart: any = null;
  @ViewChild('chartCanvas')
  private canvas: ElementRef;
  private timer: any;

  constructor(private statsService: StatsService,
              private mqttService: MqttService,
              public dialogRef: MatDialogRef<DeviceStatsDialog>,
              @Inject(MAT_DIALOG_DATA) public data: IDevice) {

    super();

    if (typeof Chart === 'undefined') {
      throw new Error('ng2-charts configuration issue: Embedding Chart.js lib is mandatory');
    }

    this.metadata = data.manifest;

    this.register(mqttService
      .on(`${data.device}/reported/+`)
      .subscribe((reported) => {
        if (this.interval <= 60 && this.metadata) {
          this.stats.push({
            timestamp: new Date(),
            ...reported
          } as IDeviceStat);

          this.updateChart();
        }
      }));
  }

  public async changeData(e: MatTabChangeEvent): Promise<void> {

    switch (e && e.index) {
      case 3:
        this.till = new Date(new Date().getTime() + 60 * 1000);
        this.since = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
        this.interval = 24 * 60 * 60;
        break;

      case 2:
        this.till = new Date(new Date().getTime() + 60 * 1000);
        this.since = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
        this.interval = 8 * 60 * 60;
        break;

      case 1:
        this.till = new Date(new Date().getTime() + 60 * 1000);
        this.since = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);
        this.interval = 60 * 60;
        break;

      default:
        this.till = new Date(new Date().getTime() + 60 * 1000);
        this.since = new Date(new Date().getTime() - 60 * 60 * 1000);
        this.interval = 60;
    }

    this.stats = await this.statsService.query(this.data.device, undefined, this.since, this.till, this.interval);
    this.updateChart();
  }

  private updateChart(): void {
    const data = this.stats = this.stats.filter(x => x.timestamp.getTime() >= this.since.getTime());
    let opts = {
      type: 'line',
      data: {
        datasets: this.metadata.mqtt.out
          .filter(prop => prop.scale !== 'timestamp')
          .map((prop, index) => ({
            data: data
              .map((d: any) => ({
                x: new Date(d.timestamp),
                y: this.getProp(d, prop)
              }))
              .filter((d: { x: Date, y: any }) => d.y != null),
            label: prop.title,

            yAxisID: prop.scale,
            // spanGaps: prop.scale !== 'bit' && prop.scale !== 'RYG',
            monotone: prop.scale === 'bit' || prop.scale === 'RYG',

            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            ...CHART_COLORS[index]
          }))
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        scales: {
          yAxes: this.metadata.mqtt.out
            .filter(prop => prop.scale !== 'timestamp')
            .map(prop => prop.scale)
            .reduce((a, name) => {
              if (a.indexOf(name) < 0) {
                a.push(name);
              }

              return a;
            }, [])
            .map(scale => ({
              id: scale,
              type: scale === 'RYG' ? 'category' : 'linear',
              labels: scale === 'RYG' ? ['Lo', 'Mid', 'Hi'] : undefined,
              position: scale !== 'bit' && scale !== 'RYG' ? 'left' : 'right',
              steppedLine: scale === 'bit' || scale === 'RYG' ? 'after' : false,
              scaleLabel: {
                display: true,
                labelString: scale,
              },
              ticks: {}
            })),
          xAxes: [{
            type: 'time',
            distribution: 'linear',
            time: {
              minUnit: 'second',
              unit: ((): string => {
                if (this.interval > 60 * 60) {
                  return 'day';
                }
                if (this.interval > 15 * 60) {
                  return 'hour';
                }
                return 'minute';
              })(),
              min: this.since,
              max: this.till
            }
          }]
        }
      }
    };

    this.destroyChart();
    this.chart = new Chart(this.ctx, opts);
  }

  async ngOnInit(): Promise<void> {
    this.timer = setInterval(() => {
      if (this.interval <= 60) {
        this.till = new Date(new Date().getTime() + 60 * 1000);
        this.since = new Date(new Date().getTime() - 60 * 60 * 1000);
        this.updateChart();
      }
    }, 60 * 1000);
    this.ctx = this.canvas.nativeElement.getContext('2d');
    await this.changeData(null);
  }

  public ngOnDestroy(): void {
    super.ngOnDestroy();
    this.destroyChart();
    clearTimeout(this.timer);
  }

  public onNoClick(): void {
    this.dialogRef.close();
  }

  private destroyChart(): void {
    if (this.chart) {
      this.chart.destroy();
      this.chart = null;
    }
  }

  private getProp(d: any, prop: IDevicePropertyOut): any {
    const value = d[prop.name];
    if (prop.scale === 'RYG') {
      switch (value) {
        case 0:
          return 'Lo';
        case 1:
          return 'Mid';
        case 2:
          return 'Hi';
        default:
          return null;
      }
    }

    if (prop.scale === 'bit' || typeof value !== 'number') {
      return value;
    }

    const precision: number = prop.precision || 0;
    const factor: number = Math.pow(10, precision + 1);
    return Math.round(value * factor) / factor;
  }
}
