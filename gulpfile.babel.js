
/* jshint esversion: 6 */
(function () {
    'use strict';

    const gulp = require('gulp');
    const sass = require('gulp-sass');
    const babel = require('gulp-babel');
    const autoprefixer = require('gulp-autoprefixer');
    const concat = require('gulp-concat');
    const rename = require('gulp-rename');
    const uglify = require('gulp-uglify');
    const jshint = require('gulp-jshint');
    const notify = require('gulp-notify');
    const sourcemaps = require('gulp-sourcemaps');
    const imagemin = require('gulp-imagemin');

    const del = require('del');
    const browserSync = require('browser-sync');
    const server = browserSync.create();

    const paths = {
        styles: {
                src: 'sass/**/*.scss',
                dest: 'css/',
            },
        images: {
                src: 'img/*',
                dest: 'dist/img/',
        },
        scripts: {
                src: 'src/scripts/**/*.js',
                dest: 'js/',
            },
        sw: {
            src: './service-worker.js',
            dest: './',
        },
    };

    const watch = () => {
        // browserSync({
        //     proxy: "https://mysite.dev",
        //     port: 3000,
        //     ui: false,
        //     https: {
        //         key: "./localhost-ssl/localhost.key",
        //         cert: "./localhost-ssl/localhost.crt"
        //     }
        // });
        gulp.watch(
            [paths.scripts.src,
                paths.styles.src,
                paths.sw.src,
                '/index.html'],
            gulp.series(scripts, styles, copyImages, copyHtml, reload)
        );
        gulp.watch(
            './build/index.html',
            gulp.series( copyHtml)).on('change', browserSync.reload);
    };

    const dev = gulp.series(clean,
        copyLibs,
        scripts,
        styles,
        copyImages,
        copyHtml,
        serve,
        watch);

    /**
     * @description Used to delete the previous version
     * @return {void}
     */
    function clean () {
        // You can use multiple globbing patterns as you would with `gulp.src`,
        // for example if you are using del 2.0 or above, return its promise
        return del(['dist']);
    }


    /**
     * @description Gulp pipe for style related work
     * @return {void}
     */
    function styles () {
        return gulp.src('./sass/**/*.scss')
            .pipe(sass({
                outputStyle: 'compressed',
            }).on('error', sass.logError))
            .pipe(autoprefixer({
                browsers: ['last 2 versions'],
            }))
            .pipe(concat('styles.css'))
            .pipe(gulp.dest('dist/css/'));
    }


    /**
     * @description Gulp process for js code
     * @return {void}
     */
    function scripts () {
        return gulp.src(paths.scripts.src, {sourcemaps: true})
        // .pipe(jshint('.jshintrc'))
        // .pipe(jshint.reporter('default'))
        .pipe(babel({presets: ['es2015']}))
        .pipe(gulp.dest('dist/scripts/'));
        // .pipe(notify({message: 'Scripts task complete'}));
    }

    // function scripts-dist() {
    //     return gulp.src(paths.scripts.src)
    //         .pipe()
    // }

    /**
     * @description Restarts the application after source file modifications
     * @param {function} done
     */
    function reload (done) {
        server.reload();
        done();
    }

    /**
     * @description Script to serve the application
     * @param {""} done
     */
    function serve (done) {
        server.init({
            server: {
            baseDir: './',
            },
        });
        done();
    }

    /**
     * @description Gulp process to  copy the index.html file
     * @return {void}
     */
    function copyHtml () {
        return gulp.src('./index.html')
            .pipe(gulp.dest('./dist'));
    }

    /**
     * @description Gulp process to copy image files
     * @return {void}
     */
    function copyImages () {
        return gulp.src('img/*')
            .pipe(imagemin())
            .pipe(gulp.dest('dist/img'));
    }

    /**
     * @description Copy third party libraries into dist folder
     * @return {void}
     */
    function copyLibs () {
        return gulp.src(['src/lib/**/*.js'])
        .pipe(sourcemaps.init())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('dist/lib'));
    }

    /*
    * You can use CommonJS `exports` module notation to declare tasks
    */
    exports.clean = clean;
    exports.copyLibs = copyLibs;
    exports.styles = styles;
    exports.scripts = scripts;
    exports.watch = watch;
    exports.copyHtml = copyHtml;
    exports.copyImages = copyImages;

    gulp.task('default', (done, error) => {
        dev();
        done();
        console.log(done);
        console.error(error);
    });
    gulp.task('styles', styles);
    gulp.task('copyHtml', copyHtml);
    gulp.task('copyImages', copyImages);
    gulp.task('copyLibs', copyLibs);
})();
