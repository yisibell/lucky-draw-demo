const { src, dest, parallel } = require('gulp')
const sass = require('gulp-sass')
const autoprefixer = require('gulp-autoprefixer')
const csso = require('gulp-csso')

function css() {
  return src('./src/styles/index.scss')
  .pipe(sass().on('error', sass.logError))
  .pipe(autoprefixer())
  .pipe(csso())
  .pipe(dest('./dist/css'))
}

exports.default = parallel(css)