var gulp = require('gulp');
var webpack = require('webpack-stream');
var webpackConfig = require("../../webpack/webpack.server.js");

var webpackBuildServerTask = function () {
  return gulp.src('')
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest('dist/'));
};

gulp.task('webpack-build-server', webpackBuildServerTask);
module.exports = webpackBuildServerTask;
