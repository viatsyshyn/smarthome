import {Express} from 'express';

import {ILogger} from '../models';
import {Storage} from '../services/storage';
import {Cache} from '../services/cache';
import {PubSub} from '../services/pubsub';
import {async_wrapper} from './shared';

export function init(app: Express, storage: Storage, cache: Cache, pubsub: PubSub, logger: ILogger): void {

  /**
   * @swagger
   * /zones:
   *   get:
   *     tags:
   *         - Zones
   *     description: list zones
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: zones list
   */
  app.get('/zones', async_wrapper(logger, async () => {
    return await storage.get('*', 'zones') || [];
  }));

  /**
   * @swagger
   * definitions:
   *   Zone:
   *     properties:
   *       name:
   *         type: string
   *         required: true
   */

  /**
   * @swagger
   * /zone/{zone}:
   *   put:
   *     tags:
   *       - Zones
   *     description: remove zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: zone
   *         description: Your zone to add
   *         in: path
   *         required: true
   *         type: string
   *       - name: body
   *         description: Your zone info
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#definitions/Zone'
   *     responses:
   *       200:
   *         description: zones list
   */
  app.put('/zone/:zone', async_wrapper(logger, async req => {
    const zone = req.params.zone;

    if (!zone) {
      throw Error('bad name');
    }
    // TODO: change to native mongodb push

    let zones = await storage.get<string[]>('*', 'zones') || [];
    zones.push(zone);
    return await storage.set('*', 'zones', zones.filter(x => x));
  }));

  /**
   * @swagger
   * /zones/{zone}:
   *   delete:
   *     tags:
   *         - Zones
   *     description: remove zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: zone
   *         description: Your zone to remove
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: zones list
   */
  app.delete('/zone/:zone', async_wrapper(logger, async req => {
    // TODO: change to native mongodb remove

    let zones = await storage.get<string[]>('*', 'zones') || [];
    zones = zones.filter(x => x !== req.params.zone);
    return await storage.set('*', 'zones', zones);
  }));
}
