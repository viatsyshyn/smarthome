import {Component, Input, OnDestroy, OnInit} from '@angular/core';

const SCALES_LIST: string[] = ['ms', 's', 'm', 'h', 'd'];
const SCALES_ORDER: any = {ms: 0, s: 1, m: 2, h: 3, d: 4};
const SCALES_MAGNITUDE: number[] = [1000, 60, 60, 24, Number.MAX_VALUE];

@Component({
  selector: 'shc-time-since',
  templateUrl: './time-since.component.html',
  styleUrls: ['./time-since.component.scss'],
})
export class TimeSinceComponent implements OnDestroy, OnInit {
  @Input() public set timestamp(value: number | Date) {
    this.ts = value === null ? null : (value instanceof Date) ? value.getTime() : value;
  }
  @Input() public set since(value: number | null) {
    this.ts = value === null ? null : this.now - value;
  }
  @Input() public freeze = false;
  @Input() public dynamicScale = true;
  @Input() public minScale: 'ms' | 's' | 'm' | 'h' | 'd' = 's';
  @Input() public fixScale: 'ms' | 's' | 'm' | 'h' | 'd' | null = null;
  @Input() public skip = 0;

  private ts: number | null = null;
  private value = '-';
  private scale = '';
  private timer: any;
  private now = new Date().getTime();

  public ngOnInit() {
    this.update();
    this.timer = setInterval(() => this.update(), 1000);
  }

  public ngOnDestroy() {
    clearTimeout(this.timer);
  }

  private update(): void {
    if (this.ts === null) {
        this.value = '-';
        this.scale = '';
        return ;
    }

    if (!this.freeze) {
        this.now = new Date().getTime();
    }
    let diff = Math.ceil(this.now - this.ts);

    if (diff <= 0) {
      this.value = 'now';
      this.scale = '';
      return ;
    }

    const minScaleIndex = SCALES_ORDER[this.minScale];
    for (const scale of SCALES_LIST) {
      const scaleIndex = SCALES_ORDER[scale];
      if (diff < this.skip && minScaleIndex === scaleIndex) {
        this.value = '';
        this.scale = '';
        return;
      }

      const scaleMax = SCALES_MAGNITUDE[scaleIndex];
      if ((diff < scaleMax && minScaleIndex <= scaleIndex) || this.fixScale === scale) {
        this.value = String(diff);
        this.scale = scale;
        return ;
      }

      diff = Math.ceil(diff / scaleMax);
    }

    this.value = '-';
    this.scale = '';
  }
}
