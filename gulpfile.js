var browserify = require('browserify');  // Bundles JS.
var gulp = require('gulp');
var bundle = require('gulp-bundle-assets');
var babelify = require('babelify');
var source = require('vinyl-source-stream');
var watchify = require('watchify');

var paths = {
  app_js: ['./src/js/app.jsx'],
  js: ['src/js/**/*.js', 'src/js/**/*.jsx'],
};

gulp.task('js', function() {
  var watch = false;
  return doIt(watch);
});
gulp.task('bwatch', function() {
  var watch = true;
});

var doIt = function (watch) {
  var b = browserify({
    entries: paths.app_js,
    extensions: [".jsx"],
    debug: true
  });

  if (watch) {
    b = browserify(b);
  }
  return b.transform("babelify", {presets: ["es2015", "react"]})
    .bundle()
    .pipe(source('bundle.js'))
    .pipe(gulp.dest('./app/static/js/'));
};

gulp.task('watch', ["bwatch"], function() {
  gulp.watch(paths.js, ['js']);
});

gulp.task('default', ['js']);
