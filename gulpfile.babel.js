
/*jshint esversion: 6 */
(function () {
    "use strict";

const gulp = require("gulp");
const sass = require("gulp-sass");
const autoprefixer = require("gulp-autoprefixer");
const concat = require('gulp-concat');
const jshint = require('gulp-jshint');
const rename = require('gulp-rename');
const uglify = require('gulp-uglify');
const notify = require('gulp-notify');
const del = require('del');
const browserSync = require('browser-sync');
const server = browserSync.create();
const watch = () => gulp.watch([paths.scripts.src, paths.styles.src], gulp.series(scripts, reload))

const dev = gulp.series(clean, scripts, styles, serve, watch);


const paths = {
    styles: {
      src: 'sass/**/*.scss',
      dest: 'css/'
    },
    scripts: {
      src: 'src/scripts/**/*.js',
      dest: 'js/'
    }
  };

function clean() {
    // You can use multiple globbing patterns as you would with `gulp.src`,
    // for example if you are using del 2.0 or above, return its promise
    return del([ 'dist' ]);
  }

function styles() {
    return gulp.src('./sass/**/*.scss')
        .pipe(sass().on('error', sass.logError))
        .pipe(autoprefixer({
            browsers: ['last 2 versions']
        }))
        .pipe(concat('styles.css'))
        .pipe(gulp.dest('./css/'));
    }

function scripts() {
    return gulp.src(paths.scripts.src, {sourcemaps: true})
    .pipe(jshint('.jshintrc'))
    .pipe(jshint.reporter('default'))
    // .pipe(concat('main.js'))
    // .pipe(rename({suffix: '.min'}))
    // .pipe(uglify())
    .pipe(gulp.dest('dist/scripts/'))
    .pipe(notify({ message: 'Scripts task complete' }));
    }

function reload(done) {
    server.reload();
    done();
    }

function serve(done) {
    server.init({
        server: {
        baseDir: './'
        }
    });
    done();
    }
// function watch() {
//     gulp.watch('scss/*.scss', [styles]);
//     gulp.watch('src/js/*.js', [scripts]);
//     }

function browserSyncIt() {
    browserSync.stream();
    }

/*
 * You can use CommonJS `exports` module notation to declare tasks
 */
exports.clean = clean;
exports.styles = styles;
exports.scripts = scripts;
exports.watch = watch;

/*
 * Specify if tasks run in series or parallel using `gulp.series` and `gulp.parallel`
 */
// var build = gulp.series(clean, gulp.parallel(styles, scripts));

/*
 * You can still use `gulp.task` to expose tasks
 */
// gulp.task('build', build);

/*
 * Define default task that can be called by just running `gulp` from cli
 */
// gulp.task('default', build, browserSyncIt);

// gulp.task('default', function() {

//     browserSync.init({
//         server: "./app"
//     });

//     watch();
//     gulp.watch(["*.html","./css/styles.css","./dist/*.js"]).on('change', browserSync.reload);
// });
gulp.task('default', () => {
    dev();
})
})();