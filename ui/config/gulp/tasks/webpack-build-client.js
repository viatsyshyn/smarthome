var gulp = require('gulp');
var webpack = require('webpack-stream');
var webpackConfig = require("../../webpack/webpack.prod.js");

var webpackBuildClientTask = function () {
  return gulp.src('')
    .pipe(webpack(webpackConfig))
    .pipe(gulp.dest('dist/public/'));
};

gulp.task('webpack-build-client', webpackBuildClientTask);
module.exports = webpackBuildClientTask;
