import { Container } from 'inversify';
import {ICACHE, ICache, ILOGGERFACTORY, ILoggerFactory, IPUBSUB, IPubSub, ISTORAGE, IStorage} from '../models';
import {LoggerFactory} from './logger';
import {MQTT, PubSub} from './pubsub';
import {Cache, REDIS} from './cache';
import {MONGODB, Storage} from './storage';
import {Evaluator, IEVALUATOR, IEvaluator} from './evalutor';
import {IWORKER, IWorker, Worker} from './worker';

import MongodbClient = require('mongodb');
import Redis = require('redis');
import Mqtt = require('mqtt');

export async function setup(): Promise<Container> {
  const logger = LoggerFactory('ioc');
  const kernel = new Container();

  kernel.bind<ILoggerFactory>(ILOGGERFACTORY).toConstantValue(LoggerFactory);

  logger.info(`Establishing connections`);
  const db = await MongodbClient.connect(process.env.STORAGE);
  logger.info(`MongoDB Initialized`);
  kernel.bind<MongodbClient.Db>(MONGODB).toConstantValue(db);

  const redis = await new Promise<Redis.RedisClient>((resolve, reject) => Redis
      .createClient(process.env.CACHE)
      .on('connect', () => {
        logger.info(`Redis Initialized`);
        resolve();
      }));
  kernel.bind<Redis.RedisClient>(REDIS).toConstantValue(redis);

  const mqtt = await new Promise<Mqtt.MqttClient>((resolve) => Mqtt
      .connect(process.env.PUBSUB)
      .once('connect', () => {
        logger.info('MQTT Initialized');
        resolve();
      }));
  kernel.bind<Mqtt.MqttClient>(MQTT).toConstantValue(mqtt);

  kernel.bind<ICache>(ICACHE).to(Cache);
  kernel.bind<IPubSub>(IPUBSUB).to(PubSub);
  kernel.bind<IStorage>(ISTORAGE).to(Storage);

  kernel.bind<IEvaluator>(IEVALUATOR).to(Evaluator);
  kernel.bind<IWorker>(IWORKER).to(Worker);

  return kernel;
}
