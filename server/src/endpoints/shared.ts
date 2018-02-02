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
  $routes: any[] = [];

  constructor(
    protected logger: ILogger
  ) {}

  public register(app: Express) {
    for (const {method, url, middleware, fnName} of this.$routes) {
      (<any>app)[method](url, ...middleware, async_wrapper(this.logger, (<any>this)[fnName], this))
    }
  }
}
