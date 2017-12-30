import {Express} from 'express';

import {ILogger} from '../models';
import {Storage} from '../services/storage';
import {Cache} from '../services/cache';
import {PubSub} from '../services/pubsub';
import {async_wrapper} from './shared';

export function init(app: Express, storage: Storage, cache: Cache, pubsub: PubSub, logger: ILogger): void {

  /**
   * @swagger
   * /history/{device}/{property}:
   *   get:
   *     tags:
   *         - Devices
   *     description: list devices
   *     produces:
   *       - application/json
   *     parameters:
   *       - name: device
   *         description: Your device
   *         in: path
   *         required: true
   *         type: string
   *       - name: property
   *         description: Your property
   *         in: path
   *         required: false
   *         type: string
   *       - name: since
   *         description: start timestamp
   *         in: query
   *         required: true
   *         type: string
   *       - name: till
   *         description: end timestamp
   *         in: query
   *         required: true
   *         type: string
   *       - name: interval
   *         description: end timestamp
   *         in: query
   *         required: true
   *         type: number
   *     responses:
   *       200:
   *         description: device stats
   */
  app.get('/history/:device', async_wrapper(async (req) => {
    const device = req.params.device;
    const property = req.params.property || undefined;
    const since = new Date(req.query.since);
    const till = new Date(req.query.till);
    const interval = parseInt(req.query.interval, 10);
    const manifest: any = await storage.get(device, 'manifest');
    return await storage.stats(device, property, since, till, interval, manifest.mqtt.out);
  }));

  app.get('/history/:device/:property', async_wrapper(async (req) => {
    const device = req.params.device;
    const property = req.params.property || undefined;
    const since = new Date(req.query.since);
    const till = new Date(req.query.till);
    const interval = parseInt(req.query.interval, 10);
    const manifest: any = await storage.get(device, 'manifest');
    return await storage.stats(device, property, since, till, interval, manifest.mqtt.out);
  }));

}
