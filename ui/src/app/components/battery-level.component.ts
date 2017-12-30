import {Component, Input} from '@angular/core';

@Component({
  selector: 'shc-battery-level',
  templateUrl: './battery-level.component.html',
  styleUrls: ['./battery-level.component.scss'],
})
export class BatteryLevelComponent {
  @Input() public value: 0 | 1 | 2 | null;
  @Input() public height = 5;
  @Input() public width = 3;
  @Input() public spacing = 0;

  public blocksIt = [0, 1, 2];
  private blocks = 3;

  public get totalWidth(): number {
    return this.width * this.blocks + this.spacing * (this.blocks - 1);
  }
}
