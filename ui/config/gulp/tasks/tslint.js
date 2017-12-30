let gulp = require('gulp');
let tslint = require('gulp-tslint');

let tslintTask = function () {
  return gulp.src(['src/**/*.ts'])
    .pipe(tslint({
        formatter: 'prose',
        configuration: 'tslint.json'
    }))
    .pipe(tslint.report());
};
gulp.task('tslint', tslintTask);
module.exports = tslintTask;
