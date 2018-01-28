import {Express} from 'express';

import {ILogger} from '../models';
import {IDeviceSetting, Storage} from '../services/storage';
import {Cache} from '../services/cache';
import {PubSub} from '../services/pubsub';
import {async_wrapper} from './shared';

export function init(app: Express, storage: Storage, cache: Cache, pubsub: PubSub, logger: ILogger): void {

  /**
   * @swagger
   * /devices:
   *   get:
   *     tags:
   *         - Devices
   *     description: list devices
   *     produces:
   *       - application/json
   *     responses:
   *       200:
   *         description: devices settings list
   */
  app.get('/devices', async_wrapper(logger, async () => {
    let devices = (await storage.query(undefined, 'manifest'))
      .filter(x => x.data != null)
      .map(x => x.device);

    let settings: IDeviceSetting[][] = await Promise.all(
      devices.map(device => storage.query(device, undefined))
    );

    return settings.map(ds => ({
      device: ds[0].device,
      zone: ds.find(x => x.key === 'zone').data,
      manifest: ds.find(x => x.key === 'manifest').data,
      title: ds.find(x => x.key === 'title').data,
    }));
  }));

  /**
   * @swagger
   * definitions:
   *   Device:
   *     properties:
   *       zone:
   *         type: string
   *         required: true
   */

  /**
   * @swagger
   * /device/{device}:
   *   patch:
   *     tags:
   *         - Devices
   *     description: identify device package and zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: device
   *         description: Your device to identify
   *         in: path
   *         required: true
   *         type: string
   *       - name: body
   *         description: Your device info
   *         in: body
   *         required: true
   *         schema:
   *           $ref: '#definitions/Device'
   *     responses:
   *       200:
   *         description: ufo devices list
   */
  app.patch('/device/:device', async_wrapper(logger, async req => {
    let device = req.params.device;
    await Promise.all([
      storage.set(device, 'zone', req.body.zone),
    ]);

    return await storage.all(device);
  }));

  /**
   * @swagger
   * /device/{device}:
   *   delete:
   *     tags:
   *         - Devices
   *     description: delete device package and zone
   *     produces:
   *       - application/json
   *     consumes:
   *       - application/json
   *     parameters:
   *       - name: device
   *         description: Your device to identify
   *         in: path
   *         required: true
   *         type: string
   *     responses:
   *       200:
   *         description: ufo devices list
   */
  app.delete('/device/:device', async_wrapper(logger, async req => {
    let device = req.params.device;
    await Promise.all([
      storage.set(device, 'zone', undefined),
      storage.set(device, 'manifest', undefined)
    ]);

    pubsub.pub('_server/device-forget', device);

    return await storage.all(device);
  }));
}
