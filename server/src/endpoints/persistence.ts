import {Express} from 'express';

import {ILogger} from '../models';
import {Storage} from '../services/storage';
import {Cache} from '../services/cache';
import {PubSub} from '../services/pubsub';
import {async_wrapper} from './shared';

export function init(app: Express, storage: Storage, cache: Cache, pubsub: PubSub, logger: ILogger): void {

  /**
   * @swagger
   * /cached/{device}/{key}:
   *   get:
   *     tags:
   *         - Cache
   *     description: delete device package and zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: device
   *         description: Your device
   *         in: path
   *         required: true
   *         type: string
   *       - name: key
   *         description: Your device's key
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: ufo devices list
   */
  app.get('/cached/:device/:key', async_wrapper(logger, (req) => {
    let device = req.params.device;
    let key = req.params.key;
    return cache.get(`${device}::${key}`);
  }));

  /**
   * @swagger
   * /storage/{device}:
   *   get:
   *     tags:
   *         - Storage
   *     description: delete device package and zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: device
   *         description: Your device
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: vale
   */
  app.get('/storage/:device', async_wrapper(logger, (req) => {
    let device = req.params.device;
    return storage.all(device);
  }));

  /**
   * @swagger
   * /storage/{device}/{key}:
   *   get:
   *     tags:
   *         - Storage
   *     description: delete device package and zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: device
   *         description: Your device
   *         in: path
   *         required: true
   *         type: string
   *       - name: key
   *         description: Your device's key
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: vale
   */
  app.get('/storage/:device/:key', async_wrapper(logger, (req) => {
    let device = req.params.device;
    let key = req.params.key;
    return storage.get(device, key);
  }));

  /**
   * @swagger
   * /storage/{device}/{key}:
   *   put:
   *     tags:
   *         - Storage
   *     description: delete device package and zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: device
   *         description: Your device
   *         in: path
   *         required: true
   *         type: string
   *       - name: key
   *         description: Your device's key
   *         in: path
   *         required: true
   *         type: string
   *       - name: body
   *         description: Your device's key
   *         in: body
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: value
   */
  app.put('/storage/:device/:key', async_wrapper(logger, (req) => {
    let device = req.params.device;
    let key = req.params.key;
    console.log('SET:', device, key, req.body);
    return storage.set(device, key, req.body);
  }));
}
