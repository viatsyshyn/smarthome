var gulp = require('gulp');
var open = require('opn');
var config = require('config');

var proxyPort = config.get('proxyPort');

var launchBrowserTask = function () {
  var url = `http://localhost:${proxyPort}`;

  open(url);
  return gulp.src('');
}
gulp.task('launch-browser', launchBrowserTask);
module.exports = launchBrowserTask;
