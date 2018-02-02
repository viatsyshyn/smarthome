import {Request} from 'express';
import {inject, injectable} from 'inversify';
const route = require('route-decorators');

import {ILoggerFactory, ILOGGERFACTORY, IStorage, ISTORAGE, IDeviceSetting} from '../models';
import {BaseEndpoint} from './shared';

@injectable()
export class DeviceEndpoints extends BaseEndpoint {

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(ISTORAGE) private storage: IStorage
  ) {
    super(factory('devices'));
  }

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
  @route.get('/devices')
  async all(): Promise<any> {
    let devices = (await this.storage.query(undefined, 'manifest'))
      .filter(x => x.data != null)
      .map(x => x.device);

    let settings: IDeviceSetting[][] = await Promise.all(
      devices.map(device => this.storage.query(device, undefined))
    );

    return settings.map(ds => ({
      device: ds[0].device,
      zone: ds.find(x => x.key === 'zone').data,
      manifest: ds.find(x => x.key === 'manifest').data,
      title: ds.find(x => x.key === 'title').data,
    }));
  }

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
  @route.patch('/device/:device')
  async patch(req: Request): Promise<any> {
    let device = req.params.device;
    await Promise.all([
      this.storage.set(device, 'zone', req.body.zone),
    ]);

    return await this.storage.all(device);
  }

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
  @route.delete('/device/:device')
  async delete(req: Request): Promise<any> {
    let device = req.params.device;
    await this.storage.remove(device);

    // pubsub.pub(`${device}/forget`, 1);

    return await this.storage.all(device);
  }
}
