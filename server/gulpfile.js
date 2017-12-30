let gulp = require('gulp');
let tslint = require('gulp-tslint');
let ts = require('gulp-typescript');
let srcmaps = require('gulp-sourcemaps');
let nodemon = require('gulp-nodemon');
let del = require('del');

gulp.task('default', ['run']);

/**
 * tslint src dir
 */
gulp.task('tslint', () => {
    return gulp.src('src/**/*.ts')
        .pipe(tslint({
            formatter: 'prose',
            configuration: 'tslint.json'
        }))
        .pipe(tslint.report());
});

/**
 * clear all dir
 */
gulp.task('clean', () => {
    return del('dist/**/*', { force: true });
});

let compile = () => {
    return gulp.src('src/**/*.ts')
        .pipe(srcmaps.init())
        .pipe(ts('tsconfig.json'))
        .js
        .pipe(srcmaps.write('.', {
            includeContent: false,
            sourceRoot: '../'
        }))
        .pipe(gulp.dest('dist'));
};

/**
 * compile ts to js with src maps
 */
gulp.task('compile', ['clean', 'tslint'], compile);
/**
 * compile ts to js with src maps
 */
gulp.task('compile:noclean', [], compile);

let watch = () => {
    gulp.watch(require('./tsconfig.json').include, ['compile:noclean']);
};

/**
 * watch then compile
 */
gulp.task('watch', [], watch);

/**
 * compile and watch
 */
gulp.task('compile:watch', ['compile'], watch);
