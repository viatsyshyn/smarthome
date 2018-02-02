import {Component, Input} from '@angular/core';
import {Scale} from '../services/device.service';

@Component({
  selector: 'shc-value-scale',
  templateUrl: './value-scale.component.html',
  styleUrls: ['./value-scale.component.scss'],
})
export class ValueScaleComponent {
  @Input() public value: any | null;
  @Input() public scale: Scale;
  @Input() public precision = 0;
  @Input() public sign = false;

  public getValue(): string {
    let value = this.value;

    if (value === null) {
      return '-';
    }

    switch (this.scale) {
      case 'bit': value = value === 1 || value === true || value === '1' ? 'on' : 'off'; break;
      case 'RYG': value = value === 2 ? 'H' : value === 1 ? 'M' : 'L' ; break;
    }

    if (typeof value === 'number') {
      const precision = Math.pow(10, this.precision);
      value = String(Math.round(precision * value) / precision);
    }

    return String(value);
  }

  public getRound(): string {
    const value = this.getValue().split('.')[0];
    return (parseInt(value, 10) >= 0 && this.sign ? '+' : '') + value;
  }

  public hasFraction(): boolean {
    switch (this.scale) {
      case 'bit': return false;
      case 'RYG': return false;
      default: return this.precision > 0;
    }
  }

  public getFraction(): string {
    if (this.precision === 0) {
      return '';
    }
    let fraction = String(this.getValue()).split('.')[1];
    if (this.value === null) {
        fraction = '-----------';
    }
    return ('.' + fraction + '0000000000').slice(0, this.precision + 1);
  }

  public getScale(): string {
    switch (this.scale) {
      case 'bit': return '';
      case 'RYG': return '';
      default: return this.scale;
    }
  }

  public hasScale(): boolean {
    switch (this.scale) {
      case 'bit': return false;
      case 'RYG': return false;
      default: return true;
    }
  }
}
