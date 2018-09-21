import {NextFunction, RequestHandler, Request, Response, Express} from 'express';
import {ILogger} from '../models';
import {injectable} from 'inversify';

function async_wrapper(logger: ILogger, cb: (req: Request) => Promise<any>, scope: any = null): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction): any {
    cb.call(scope, req)
      .then((x: any) => res.json(x))
      .catch((err: Error) => {
        res.status(500);
        res.send(err.message);
        logger.error(err);
      });
  };
}

@injectable()
export class BaseEndpoint {
  constructor(
    protected logger: ILogger
  ) {}

  public register(app: Express) {
    const proto = Object.getPrototypeOf(<any>this);
    const name = proto.constructor.name;
    const routes = Object.getOwnPropertyNames(proto)
        .filter(name => name.startsWith('$$route_'))
        .map(name => ({
          ...proto[name],
          fnName: name.replace('$$route_', '')
        }));
    for (const {method, path, middleware, fnName} of routes) {
      this.logger.log(`register ${name} ${method} ${path}`);
      (<any>app)[method](path, ...middleware, async_wrapper(this.logger, (<any>this)[fnName], this))
    }
  }
}
