import {Component, Input} from '@angular/core';

@Component({
  selector: 'shc-single-value',
  templateUrl: './single-value.component.html',
  styleUrls: ['./single-value.component.scss'],
})
export class SingleValueComponent {
  @Input() public active: boolean | number = null;
  @Input() public height = 48;
  @Input() public width = 48;

  private get borderRadius(): number {
    return Math.floor(Math.min(this.width, this.height) / 2);
  }
}
