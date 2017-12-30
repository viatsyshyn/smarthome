import {Component, Input} from '@angular/core';

@Component({
  selector: 'shc-icon-device',
  templateUrl: './icon-device.component.html',
  styleUrls: ['./icon-device.component.scss'],
})
export class IconDeviceComponent {
  @Input() public active = true;
  @Input() public batteryLevel: 0 | 1 | 2 | null = null;
  @Input() public lastUpdated: Date | number = null;
}
