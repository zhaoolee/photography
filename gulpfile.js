"use strict";

var gulp = require("gulp");
var imageResize = require("gulp-image-resize");
var gulpif = require("gulp-if");
var sass = require("gulp-sass")(require("sass"));
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var del = require("del");
var fs = require("fs");
var path = require("path");
var exec = require("child_process").exec;
var through2 = require("through2");
var treeKill = require('tree-kill');

var jekyllProcess;

gulp.task("jekyll-serve", function (done) {
    console.log('==run==jekyll-serve==fun')
  
    if (jekyllProcess) {
      console.log('kill jekyll-serve')
      treeKill(jekyllProcess.pid, 'SIGKILL', function(err){
        if(err){
          console.log("Error while killing old jekyll process: ", err);
          done(err);
        }
        else{
          console.log("Successfully killed old jekyll process");
          startNewJekyllProcess(done);
        }
      });
    }
    else{
      startNewJekyllProcess(done);
    }
  });
  
  function startNewJekyllProcess(done){
    jekyllProcess = exec(
      "bundle exec jekyll serve",
      function (err, stdout, stderr) {
        console.log('=start jekyll=', stdout);
        console.log(stderr);
        done(err);
      }
    );
  }
  

gulp.task("delete", function () {
  return del(["images/*.*"]);
});

function shouldResize(file) {
  var destPath = path.join("images/thumbs", path.basename(file.path));
  var fileExists = fs.existsSync(destPath);
  if (!fileExists) {
    console.log("Resizing file: " + file.path + " Destination: " + destPath);
  }
  return !fileExists;
}

gulp.task("resize-images", function () {
  return gulp
    .src("images/fulls/*.*")
    .pipe(
      gulpif(
        shouldResize,
        imageResize({
          width: 512,
          imageMagick: true,
        })
      )
    )
    .pipe(gulp.dest("images/thumbs"));
});

// compile scss to css
gulp.task("sass", function () {
  return gulp
    .src("./assets/sass/main.scss")
    .pipe(sass({ outputStyle: "compressed" }).on("error", sass.logError))
    .pipe(rename({ basename: "main.min" }))
    .pipe(gulp.dest("./assets/css"));
});

// watch changes in scss files and run sass task
gulp.task("sass:watch", function () {
  gulp.watch("./assets/sass/**/*.scss", ["sass"]);
});

gulp.task("clean-thumbs", function () {
  console.log("==run-clean-thumbs");
  return gulp.src("images/thumbs/*.*").pipe(
    through2.obj(async (file, _, cb) => {
      const fileName = path.basename(file.path);
      const fullPath = path.join("images/fulls", fileName);

      if (!fs.existsSync(fullPath)) {
        await del(file.path);
      }

      cb(null, file);
    })
  );
});

// minify js
gulp.task("minify-js", function () {
  return gulp
    .src("./assets/js/main.js")
    .pipe(uglify())
    .pipe(rename({ basename: "main.min" }))
    .pipe(gulp.dest("./assets/js"));
});

// build task
gulp.task("build", gulp.series("sass", "minify-js"));

// resize images
gulp.task("resize", gulp.series(["resize-images", "clean-thumbs"]));

gulp.task("zhaoolee-watch", function () {
  gulp.series("jekyll-serve")();
  gulp.watch("images/fulls/*.*", gulp.series("resize"));
});

// default task
gulp.task("default", gulp.series("build", "resize"));
