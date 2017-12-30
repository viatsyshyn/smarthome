import {Observable} from 'rxjs/Observable';

import * as Mqtt from 'mqtt';
const mqtt_regex = require('mqtt-regex');

import {IMqttService} from './mqtt.service.d';

export * from './mqtt.service.d';

export class MqttService implements IMqttService {
  private subscriptions = new Set<string>();
  private mqtt: Mqtt.Client;

  public connect(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      this.mqtt = Mqtt
        .connect(`${location.origin.replace('http', 'ws')}/ws`)
        .once('connect', () => resolve());

      this.mqtt
        .on('message', (t, m) => console.log(t, m.toString()));
    });
  }

  public pub(topic: string, msg: any): void {
    this.mqtt.publish(topic, JSON.stringify(msg));
  }

  public on<T = any>(topic: string): Observable<[string, T]> {
    return Observable.create(observer => {
      const subs = this.subscriptions;
      if (!subs.has(topic)) {
        this.mqtt.subscribe(topic);
        subs.add(topic);
      }

      let regex = mqtt_regex(topic);

      this.mqtt
        .on('message', (t, m) => {
          if (regex.exec(t)) {
            observer.next([t, JSON.parse(m.toString())]);
          }
        });
    });
  }
}
