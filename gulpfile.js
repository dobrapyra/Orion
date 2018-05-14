let gulp = require( 'gulp' ),
  concat = require( 'gulp-concat' ),
  rename = require( 'gulp-rename' ),
  stripdebug = require( 'gulp-strip-debug' ),
  uglify = require( 'gulp-uglify' );

gulp.task( 'build', () => {
  return gulp
    .src( [
      './src/orion/info.js',
      './src/vendors/polyfills/info.js',
      './src/vendors/polyfills/Object/keys.js',
      './src/vendors/polyfills/Object/assign.js',
      './src/vendors/loop.js',
      './src/orion/constellation.js',
      './src/orion/core.js'
    ] )
    .pipe( concat( 'orion.js' ) )
    .pipe( gulp.dest( './dist' ) )
    .pipe( rename( 'orion.min.js' ) )
    .pipe( stripdebug() )
    .pipe( uglify( {
      output: {
        comments: `/^!/`
      }
    } ) )
    .pipe( gulp.dest( './dist' ) );
} );

// default tasks
gulp.task( 'default', [ 'build' ] );