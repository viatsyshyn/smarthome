import Mqtt = require('mqtt');
import {ILogger, IPubSub} from '../models';

const mqtt_regex = require('mqtt-regex');

export class PubSub {
  private subscriptions = new Set<string>();
  private mqtt: Mqtt.Client;
  private logger: ILogger;

  async init(url: string, logger: ILogger): Promise<void> {
    this.logger = logger;
    logger.log(`Connection to ${url}`);
    return new Promise<void>((resolve) => {
      this.mqtt = Mqtt
        .connect(url)
        .once('connect', () => {
          logger.info('Initialized');
          resolve();
        });
    });
  }

  sub(topic: string, cb: (msg: string, topic: string) => void): PubSub {
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

  pub(topic: string, msg: any): PubSub {
    let data = JSON.stringify(msg);
    this.logger.log(`Publish ${topic} ${data}`);
    this.mqtt.publish(topic, data);
    return this;
  }

  getDevicePubSub(device: string): IPubSub {
    return <IPubSub>{
      id: () => device,
      sub: <T = any>(topic: string, cb: (msg: T) => void): void => {
        const device_topic = `${device}/${topic}`;
        this.sub(device_topic, (msg: any, t: string) => device_topic === t ? cb(msg) : null);
      },
      pub: <T = any>(topic: string, msg: T): void => {
        this.pub(`${device}/${topic}`, msg);
      }
    };
  }
}

const pubsub = new PubSub();
export default pubsub;
