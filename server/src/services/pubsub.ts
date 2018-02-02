import { injectable, inject } from 'inversify';
import Mqtt = require('mqtt');
import {ILogger, ILoggerFactory, ILOGGERFACTORY, IPubSub, TMessageHandler} from '../models';

export const MQTT = Symbol.for('Mqtt');

const mqtt_regex = require('mqtt-regex');

@injectable()
export class PubSub implements IPubSub {
  private subscriptions = new Set<string>();
  private logger: ILogger;

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(MQTT) private mqtt: Mqtt.Client
  ) {
    this.logger = factory('pubsub');
  }


  sub<T = any>(topic: string, cb: TMessageHandler<T>): IPubSub {
    this.logger.log(`Subscribe ${topic}`);
    const subs = this.subscriptions;
    if (!subs.has(topic)) {
      this.mqtt.subscribe(topic);
      subs.add(topic);
    }

    let regex = mqtt_regex(topic);

    this.mqtt
      .on('message', (t, m) => {
        if (regex.exec(t)) {
          try {
            cb(JSON.parse(m.toString()), t);
          } catch (e) {
            // ignore
          }
        }
      });
    return this;
  }

  pub<T = any>(topic: string, msg: T): IPubSub {
    let data = JSON.stringify(msg);
    this.logger.log(`Publish ${topic} ${data}`);
    this.mqtt.publish(topic, data);
    return this;
  }
}
