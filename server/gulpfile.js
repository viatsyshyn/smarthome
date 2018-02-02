let gulp = require('gulp');
let tslint = require('gulp-tslint');
let ts = require('gulp-typescript');
let srcmaps = require('gulp-sourcemaps');
let nodemon = require('gulp-nodemon');
let del = require('del');
let mocha = require('gulp-mocha');
let util = require('gulp-util');

/**
 * Handle errors.
 */

function handleError(err) {
    util.log(util.colors.red('ERROR...'));
    util.log(err);
    this.emit('end');
}

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
    return del('dist/src/**/*', { force: true });
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
        .pipe(gulp.dest('dist/src'));
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

gulp.task('build', ['compile']);

/**
 * Clean unit tests build directory.
 */

gulp.task('clean-unit-tests', () => {
    del.sync('dist/test/unit/**/*');
});

/**
 * Build unit tests
 */

gulp.task('build-unit-tests', ['clean-unit-tests'], () => {
    // Build source.
    return gulp.src('test/unit/**/*.ts')
        .pipe(srcmaps.init())
        .pipe(ts('tsconfig-tests.json'))
        // we pipe the js stream to gulp-sourcemaps module
        // so we have sourcemap available to us, allowing us to
        // debug our code in the original Typescript rather than js
        .js
        .pipe(srcmaps.write('.', {
            includeContent: false,
            sourceRoot: '../'
        }))
        .pipe(gulp.dest('dist/test/unit'));
});

/**
 * Run unit tests.
 */
gulp.task('unit', ['build', 'build-unit-tests'], () => {
    process.env.NODE_ENV = 'localtest';
    process.env.SUPPRESS_NO_CONFIG_WARNING = 'SUPPRESS_NO_CONFIG_WARNING';
    return gulp.src('dist/test/unit/**/*.spec.js', { read: false })
        .pipe(mocha({ reporter: 'spec' }))
        .on('error', handleError);
});

gulp.task('single-unit-test', ['build', 'build-unit-tests'], () => {
    let testName = process.argv[3];
    if (!testName) {
        console.log('no test name found. Usage: gulp single-unit-test -test-file-name.spec');
    }
    // trim leading dashes
    let nameStart = 0;
    while (testName.charAt(nameStart) === '-') {
        nameStart++;
    }
    testName = testName.substring(nameStart);
    console.log('running tests for "' + testName + '"');
    process.env.NODE_ENV = 'localtest';
    return gulp.src('dist/test/unit/**/' + testName + '.js')
        .pipe(mocha({ reporter: 'spec' }))
        .on('error', handleError)
        .pipe(exit());
});