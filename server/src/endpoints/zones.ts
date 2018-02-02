import {Request} from 'express';
import {BaseEndpoint} from './shared';
import {ILoggerFactory, ILOGGERFACTORY, IStorage, ISTORAGE} from '../models';
import {inject, injectable} from 'inversify';
const route = require('route-decorators');

@injectable()
export class ZonesEndpoints extends BaseEndpoint {

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(ISTORAGE) private storage: IStorage
  ) {
    super(factory('zones'));
  }


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
  @route.get('/zones')
  async get(): Promise<any> {
    return await this.storage.get('*', 'zones') || [];
  }

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
  @route.put('/zone/:zone')
  async put(req: Request): Promise<any> {
    const zone = req.params.zone;

    if (!zone) {
      throw Error('bad name');
    }
    // TODO: change to native mongodb push

    let zones = await this.storage.get<string[]>('*', 'zones') || [];
    zones.push(zone);
    return await this.storage.set('*', 'zones', zones.filter(x => x));
  }

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
  @route.delete('/zone/:zone')
  async delete(req: Request): Promise<any> {
    // TODO: change to native mongodb remove

    let zones = await this.storage.get<string[]>('*', 'zones') || [];
    zones = zones.filter(x => x !== req.params.zone);
    return await this.storage.set('*', 'zones', zones);
  }
}
