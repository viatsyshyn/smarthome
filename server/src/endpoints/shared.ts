import {NextFunction, RequestHandler, Request, Response} from 'express';

export function async_wrapper(cb: (req: Request) => Promise<any>): RequestHandler {
  return function (req: Request, res: Response, next: NextFunction): any {
    cb(req)
      .then(x => res.json(x))
      .catch(err => {
        res.status(500);
        res.send(err.message);
      });
  };
}
