import express = require('express');
import process = require('process');
import bodyParser = require('body-parser');

const methodOverride = require('method-override');

import {LoggerFactory} from './services/logger';
import cache, {Cache} from './services/cache';
import storage, {Storage} from './services/storage';
import pubsub, {PubSub} from './services/pubsub';
import {Express} from 'express';
import {ILogger} from './models';

const logger = LoggerFactory('api');

logger.log('Initializing...');

const app: Express = express();

app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(bodyParser.raw());
app.use(bodyParser.text());
app.use(methodOverride());

const apis = [
  __dirname + '/endpoints/devices.js',
  __dirname + '/endpoints/zones.js',
  __dirname + '/endpoints/persistence.js',
  __dirname + '/endpoints/stats.js',
];

apis.forEach(api => {
  type ApiInitDecl = (app: Express, storage: Storage, cache: Cache, pubsub: PubSub, logger: ILogger) => void;
  const apiDecl: ApiInitDecl = require(api).init;
  apiDecl(app, storage, cache, pubsub, logger);
});

let port = parseInt(process.env.PORT, 10) || 3000;
const env = process.env.NODE_ENV || 'development';
if (env === 'development') {
  const errorHandler = require('errorhandler');
  const SwaggerUI = require('swagger-ui-express');
  const SwaggerJSDoc = require('swagger-jsdoc');

  app.use(errorHandler());

  logger.log('Initialize swagger');
  let definitions = SwaggerJSDoc({
    swaggerDefinition: {
      info: require('./../package.json'),
      host: `localhost:${port}`,
      basePath: '/'
    },
    apis: apis
  });

  app.use('/swagger',
    SwaggerUI.serve,
    SwaggerUI.setup(definitions));
}

async function main() {
  await Promise.all([
    cache.init(process.env.CACHE, LoggerFactory('cache')),
    storage.init(process.env.STORAGE, LoggerFactory('storage')),
    pubsub.init(process.env.PUBSUB, LoggerFactory('pubsub'))
  ]);

  await new Promise((resolve, reject) => {
    logger.info(`Starting on ${port}`);
    app.listen(port, (err: Error) => err ? reject(err) : resolve())
      .on('close', () => logger.info(`Connection closed`))
      .on('error', (e) => logger.error(`Connection error ${e.message}`))
  });

  logger.info('Initialized');
}

main().catch(logger.error);

process.on('SIGINT', function () {
  // todo: graceful exit
  process.exit(0);
});
