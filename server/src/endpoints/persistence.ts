import {inject, injectable} from 'inversify';
const route = require('route-decorators');
import {BaseEndpoint} from './shared';
import {ICache, ICACHE, ILoggerFactory, ILOGGERFACTORY, IStorage, ISTORAGE} from '../models';
import {Request} from 'express';

@injectable()
export class PersistenceEndpoints extends BaseEndpoint {

  constructor(
    @inject(ILOGGERFACTORY) factory: ILoggerFactory,
    @inject(ICACHE) private cache: ICache,
    @inject(ISTORAGE) private storage: IStorage
  ) {
    super(factory('persistance'));
  }

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
  @route.get('/cached/:device/:key')
  async cached(req: Request): Promise<any> {
    let device = req.params.device;
    let key = req.params.key;
    return this.cache.get(`${device}::${key}`);
  }

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
  @route.get('/storage/:device')
  async stored(req: Request): Promise<any> {
    let device = req.params.device;
    return this.storage.all(device);
  }

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
  @route.get('/storage/:device/:key')
  async setting(req: Request): Promise<any> {
    let device = req.params.device;
    let key = req.params.key;
    return this.storage.get(device, key);
  }

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
  @route.put('/storage/:device/:key')
  async put(req: Request): Promise<any> {
    let device = req.params.device;
    let key = req.params.key;
    return this.storage.set(device, key, req.body);
  }
}
