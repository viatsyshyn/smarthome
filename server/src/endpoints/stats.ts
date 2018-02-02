import {Request} from 'express';
import {BaseEndpoint} from './shared';
import {inject, injectable} from 'inversify';
import {ILoggerFactory, ILOGGERFACTORY, IStorage, ISTORAGE} from '../models';
const route = require('route-decorators');

@injectable()
export class StatsEndpoints extends BaseEndpoint {

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(ISTORAGE) private storage: IStorage
  ) {
    super(factory('stats'));
  }

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
  @route.get('/history/:device')
  async device(req: Request): Promise<any> {
    const device = req.params.device;
    const property = req.params.property || undefined;
    const since = new Date(req.query.since);
    const till = new Date(req.query.till);
    const interval = parseInt(req.query.interval, 10);
    const manifest: any = await this.storage.get(device, 'manifest');
    return await this.storage.stats(device, property, since, till, interval, manifest.mqtt.out);
  }

  @route.get('/history/:device/:property')
  async property(req: Request): Promise<any> {
    const device = req.params.device;
    const property = req.params.property || undefined;
    const since = new Date(req.query.since);
    const till = new Date(req.query.till);
    const interval = parseInt(req.query.interval, 10);
    const manifest: any = await this.storage.get(device, 'manifest');
    return await this.storage.stats(device, property, since, till, interval, manifest.mqtt.out);
  }

}
