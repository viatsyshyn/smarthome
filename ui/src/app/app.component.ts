import { Component } from '@angular/core';
import { MqttService } from './services/mqtt.service';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent  {
  constructor(
    private mqttService: MqttService
  ) {
    this.mqttService.connect();
  }
}
