'use strict';

var gulp = require('gulp');
var imageResize = require('gulp-image-resize');
var gulpif = require('gulp-if');
var sass = require('gulp-sass')(require('sass'));
var uglify = require('gulp-uglify');
var rename = require('gulp-rename');
var del = require('del');
var fs = require('fs');
var path = require('path');


gulp.task('delete', function () {
    return del(['images/*.*']);
});

function shouldResize(file) {
    var destPath = path.join('images/thumbs', path.basename(file.path));
    var fileExists = fs.existsSync(destPath);
    if (!fileExists) {
        console.log('Resizing file: ' + file.path + ' Destination: ' + destPath);
    }
    return !fileExists;
}

gulp.task('resize-images', function () {
    return gulp.src('images/fulls/*.*')
        .pipe(gulpif(shouldResize, imageResize({
            width: 512,
            imageMagick: true
        })))
        .pipe(gulp.dest('images/thumbs'));
});

// compile scss to css
gulp.task('sass', function () {
    return gulp.src('./assets/sass/main.scss')
        .pipe(sass({outputStyle: 'compressed'}).on('error', sass.logError))
        .pipe(rename({basename: 'main.min'}))
        .pipe(gulp.dest('./assets/css'));
});

// watch changes in scss files and run sass task
gulp.task('sass:watch', function () {
    gulp.watch('./assets/sass/**/*.scss', ['sass']);
});

// minify js
gulp.task('minify-js', function () {
    return gulp.src('./assets/js/main.js')
        .pipe(uglify())
        .pipe(rename({basename: 'main.min'}))
        .pipe(gulp.dest('./assets/js'));
});

// build task
gulp.task('build', gulp.series('sass', 'minify-js'));

// resize images
gulp.task('resize', gulp.series('resize-images'));

// default task
gulp.task('default', gulp.series('build', 'resize'));
