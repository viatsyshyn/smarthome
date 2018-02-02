import 'reflect-metadata';

import express = require('express');
import process = require('process');
import bodyParser = require('body-parser');

const methodOverride = require('method-override');

import {Express} from 'express';

import {setup} from './services'
import {register, APIs} from './endpoints';
import {Container} from 'inversify';
import {ILogger, ILOGGERFACTORY, ILoggerFactory} from './models';

let port = parseInt(process.env.PORT, 10) || 3000;
const env = process.env.NODE_ENV || 'development';

const app: Express = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(methodOverride());

if (env === 'development') {
  const errorHandler = require('errorhandler');
  const SwaggerUI = require('swagger-ui-express');
  const SwaggerJSDoc = require('swagger-jsdoc');

  app.use(errorHandler());

  let definitions = SwaggerJSDoc({
    swaggerDefinition: {
      info: require('./../../package.json'),
      host: `localhost:${port}`,
      basePath: '/'
    },
    apis: APIs
  });

  app.use('/swagger',
    SwaggerUI.serve,
    SwaggerUI.setup(definitions));
}

let kernel: Container;
let logger: ILogger;

setup()
  .then(k => {
    kernel = k;
    logger = kernel.get<ILoggerFactory>(ILOGGERFACTORY)('apis');
  })
  .then(() => register(kernel, app))
  .then(() => new Promise((resolve, reject) => {
    logger.info(`Starting on ${port}`);
    app.listen(port, (err: Error) => err ? reject(err) : resolve())
      .on('close', () => logger.info(`Connection closed`))
      .on('error', (e) => logger.error(`Connection error ${e.message}`))
  }))
  .then(() => logger.info('Initialized'))
  .catch(e => logger.error(e));

process.on('SIGINT', function () {
  // todo: graceful exit
  process.exit(0);
});
