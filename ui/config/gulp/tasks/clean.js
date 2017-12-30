let gulp = require('gulp');
let del = require('del');

const cleanTask = function () {
  return del.sync([__dirname + '/../../../dist/**/*', __dirname + '/../../../src/static/runtime.umd.js']);
};

gulp.task('clean', cleanTask);
module.exports = cleanTask;
