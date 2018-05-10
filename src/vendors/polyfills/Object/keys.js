/**
 * Object.keys from EasyPure by dobrapyra
 * date: 2018.05.10
 * url: https://github.com/dobrapyra/EasyPure/blob/master/src/polyfills/Object/keys.js
 */
if( !Object.keys ) {
  Object.keys = function( obj ) {

    if( obj !== Object( obj ) ) throw new TypeError( 'Object.keys called on a non-object' );

    var keysArr = [], key;

    for( key in obj ) {
      if( obj.hasOwnProperty( key ) ) keysArr.push( key );
    }

    return keysArr;
  };
}