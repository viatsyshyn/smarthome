import {Component, Input} from '@angular/core';

@Component({
  selector: 'shc-double-value',
  templateUrl: './double-value.component.html',
  styleUrls: ['./double-value.component.scss'],
})
export class DoubleValueComponent {
  @Input() public active: boolean | number = null;
  @Input() public height = 48;
  @Input() public width = 48;

  private get borderRadius(): number {
    return Math.floor(Math.min(this.width, this.height) / 2);
  }
}
