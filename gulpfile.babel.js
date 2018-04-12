
/*jshint esversion: 6 */
(function () {
    "use strict";

    const gulp = require("gulp");
    const sass = require("gulp-sass");
    const autoprefixer = require("gulp-autoprefixer");
    const concat = require('gulp-concat');
    const jshint = require('gulp-jshint');
    const notify = require('gulp-notify');
    const npmDist = require('gulp-npm-dist');

    const del = require('del');
    const browserSync = require('browser-sync');
    const server = browserSync.create();

    const paths = {
        styles: {
                src: 'sass/**/*.scss',
                dest: 'css/'
            },
        scripts: {
                src: 'src/scripts/**/*.js',
                dest: 'js/'
            },
        sw: {
            src: './service-worker.js',
            dest: './'
        }
    };


    const watch = () =>
    // browserSync({
    //     proxy: "https://mysite.dev",
    //     port: 3000,
    //     ui: false,
    //     https: {
    //         key: "./localhost-ssl/localhost.key",
    //         cert: "./localhost-ssl/localhost.crt"
    //     }
    // });
    gulp.watch([paths.scripts.src, paths.styles.src, paths.sw.src],
        gulp.series(scripts, styles, reload));

    const dev = gulp.series(clean, copyLibs, scripts, styles, serve, watch);



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

    function copyLibs() {
        return gulp.src(npmDist(), {base:'./node_modules'})
        .pipe(gulp.dest('./dist/scripts'));
    }

    /*
    * You can use CommonJS `exports` module notation to declare tasks
    */
    exports.clean = clean;
    exports.copyLibs = copyLibs;
    exports.styles = styles;
    exports.scripts = scripts;
    exports.watch = watch;

    gulp.task('default', (done, error) => {
        dev();
        done();
        console.log(done);
        console.error(error);
    });
})();