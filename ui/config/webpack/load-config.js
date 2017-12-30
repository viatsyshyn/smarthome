var _ = require('lodash');
var config = require('config');

const CONFIG = {
  port: config.get('port'),
};

exports.CONFIG = CONFIG;
