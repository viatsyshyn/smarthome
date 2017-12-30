var gulp = require('gulp');
var config = require('config');
var gutil = require("gulp-util");
var webpack = require("webpack");
var webpackDevServer = require('webpack-dev-server');
var webpackConfig = require("../../webpack/webpack.dev.js");
var port = process.env.PORT || config.get('port');
var path = require('path');

var webpackDevServerTask = function () {
  var config = Object.create(webpackConfig);
  var compiler = webpack(config);

  var server = new webpackDevServer(compiler, {
    hot: true,
    stats: 'minimal',
    publicPath: '/static/',
    historyApiFallback: {
      index: '/static/index.html'
    }
  });

  server.listen(port);
};

gulp.task('webpack-dev-server', webpackDevServerTask);
module.exports = webpackDevServerTask;
