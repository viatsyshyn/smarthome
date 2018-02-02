import {Component, Input, OnDestroy, OnInit} from '@angular/core';

export interface ISingleScaleSettings {
  name?: string;
  precision?: number;
  scale: string;
  sign?: boolean;
  value: any,
  lambda?: string;
}

export interface IScaleSettings {
  state?: ISingleScaleSettings;
  prime: ISingleScaleSettings,
  secondary?: ISingleScaleSettings
}

@Component({
  selector: 'shc-scale-set',
  templateUrl: './scale-set.component.html',
})
export class ScaleSetComponent {
  @Input() public scales: IScaleSettings[];
  @Input() public manifest: any = null;
}
