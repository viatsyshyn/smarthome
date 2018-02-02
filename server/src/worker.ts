import 'reflect-metadata';

import {setup} from './services';
import {IWORKER, IWorker} from './services/worker';
import {ILoggerFactory, ILOGGERFACTORY} from './models';

setup()
  .then(kernel => kernel
      .get<IWorker>(IWORKER)
      .start()
      .catch((e) => kernel
          .get<ILoggerFactory>(ILOGGERFACTORY)('worker')
          .error(e)));
