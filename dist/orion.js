/*!
 * Orion
 * version: 2018.05.12
 * author: dobrapyra
 * url: https://github.com/dobrapyra/Orion
 */
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
/**
 * Object.assign from EasyPure by dobrapyra
 * date: 2018.05.10
 * url: https://github.com/dobrapyra/EasyPure/blob/master/src/polyfills/Object/assign.js
 */
if( !Object.assign ) {
  Object.assign = function( obj/*, srcObjs*/ ) {

    if( obj !== Object( obj ) ) throw new TypeError( 'Object.assign called on a non-object' );

    var resultObj, tmpSource, keysArr, i, l, j, k, tmpKey;

    resultObj = Object( obj );

    l = arguments.length;
    for( i = 1; i < l; i++ ) {
      tmpSource = arguments[ i ];

      if( !tmpSource ) continue;

      keysArr = Object.keys( tmpSource );

      k = keysArr.length;
      for( j = 0; j < k; j++ ) {
        tmpKey = keysArr[ j ];

        resultObj[ tmpKey ] = tmpSource[ tmpKey ];
      }
    }

    return resultObj;
  };
}
/**
 * getOffset from EasyPure by dobrapyra
 * date: 2018.05.10
 * url: https://github.com/dobrapyra/EasyPure/blob/master/src/functions/getOffset.js
 */
Element.prototype.getOffset = function( relEl, withScroll ) {
  var el, offset = { l: 0, t: 0 };
  for( el = this; el && el !== relEl; el = el.offsetParent ) {
    offset.l += el.offsetLeft;
    offset.t += el.offsetTop;
    if( withScroll ) {
      offset.l -= el.scrollLeft;
      offset.t -= el.scrollTop;
    }
  }
  return offset;
};
/**
 * GameLoop
 * version: 2018.05.10
 * author: dobrapyra
 * url: https://github.com/dobrapyra/GameLoop
 */
/*! url: https://github.com/dobrapyra/GameLoop */
var Loop = function(cfg){ this.init(cfg); };
Object.assign(Loop.prototype, {

  init: function(cfg) {
    // config
    var nope = function(){};
    this.onUpdate = cfg.handleUpdate || nope;
    this.onRender = cfg.handleRender || nope;
    this.onPanic = cfg.handlePanic || nope;
    this.onRawFrame = cfg.handleRawFrame || null;
    this.timestep = cfg.timestep || ( 1000 / 60 );
    this.minFrameTime = 1000 / ( cfg.fpsLimit || 66 );
    this.fpsMeter = cfg.fpsMeter || true;

    // vars
    this.started = false;
    this.running = false;
    this.rafId = null;
    this.lastFrameTime = 0;
    this.lastFpsUpdate = 0;
    this.framesThisSecond = 0;
    this.delta = 0;
    this.fps = this.fpsMeter ? 0 : null;

    // bind this
    this.start = this.start.bind(this);
    this.stop = this.stop.bind(this);
    this.initLoop = this.initLoop.bind(this);
    this.loop = this.loop.bind(this);
  },

  update: function(delta) {
    this.onUpdate(delta);
  },

  render: function(interp) {
    this.onRender(interp, this.fps);
  },

  start: function() {
    if( !this.started ) {
      this.started = true;

      // first frame for get timestamp and initial render
      this.rafId = requestAnimationFrame( this.initLoop );
    }
  },

  stop: function() {
    this.running = false;
    this.started = false;
    cancelAnimationFrame( this.rafId );
  },

  initLoop: function(timestamp) {
    this.render(1); // initial render
    this.running = true;

    // reset some vars
    this.lastFrameTime = timestamp;
    this.lastFpsUpdate = timestamp;
    this.framesThisSecond = 0;

    // first standard frame
    this.rafId = requestAnimationFrame( this.loop );
  },

  loop: function(timestamp) {
    // raw frame mode - begin
    if( this.onRawFrame !== null ) {
      this.onRawFrame(timestamp);
      this.rafId = requestAnimationFrame( this.loop );
      return;
    }
    // raw frame mode - end

    // fps throttle - begin
    if( timestamp < this.lastFrameTime + this.minFrameTime ) {
      this.rafId = requestAnimationFrame( this.loop );
      return;
    }
    // fps throttle - end

    this.delta += timestamp - this.lastFrameTime;
    this.lastFrameTime = timestamp;

    // fps meter - begin
    if( this.fpsMeter ) {
      if( timestamp > this.lastFpsUpdate + 1000 ) { // update every second
        // this.fps = 0.4 * this.framesThisSecond + 0.6 * this.fps; // compute the new fps
        this.fps = this.framesThisSecond;

        this.lastFpsUpdate = timestamp;
        this.framesThisSecond = 0;
      }
      this.framesThisSecond++;
    }
    // fps meter - end

    // panic handler loop - begin
    var updateSteps = 0;
    while( this.delta >= this.timestep ) {
      this.update( this.timestep );
      this.delta -= this.timestep;

      if( ++updateSteps >= 240 ) {
        this.panic();
        break;
      }
    }
    // panic handler loop - end

    this.render( this.delta / this.timestep );

    // next standard frame
    this.rafId = requestAnimationFrame( this.loop );
  },

  panic: function() {
    console.warn('panic');
    this.delta = 0;
    this.onPanic();
  }

});
/**
 * OrionConstellation - the part of Orion
 * version: 2018.05.10
 * author: dobrapyra
 * url: https://github.com/dobrapyra/Orion
 */
var OrionConstellation = function(props){ this.init(props); };
Object.assign(OrionConstellation.prototype, {

  init: function(props) {
    var points = props.points || {};
    var force = props.force || {};
    var amplitude = props.amplitude || {};
    var speed = props.speed || {};
    var opacity = props.opacity || {};

    this.onlyInside = props.onlyInside || false;

    this.borderVertices = Object.assign([], points.border);
    this.prepareVertices( this.borderVertices, {
      force: force.border || 60
    }, {
      static: true,
      border: true
    } );

    this.insideVertices = Object.assign([], points.inside);
    this.prepareVertices( this.insideVertices, {
      ampMin: amplitude.min,
      ampMax: amplitude.max,
      speedMin: speed.min,
      speedMax: speed.max,
      force: force.border || 40
    } );

    this.cursorPoint = {
      curr: {
        x: 0,
        y: 0
      },
      hidden: this.onlyInside ? true : false,
      force: force.cursor || 120
    };

    this.vertices = [].concat( this.borderVertices, this.insideVertices );
    this.vertices.push( this.cursorPoint );

    this.createEdges();

    this.cursorPoint.static = true; // after createEdges

    this.borderStrokeStyle = 'rgba(255,255,255,' + (
      opacity.border !== undefined ? opacity.border : 0.5
    ) + ')';
  },

  prepareVertices: function(vertices, props, customProps) {
    var static = customProps && customProps.static ? true : false;

    var ampMin = props.ampMin !== undefined ? props.ampMin : 10; // allow 0
    var ampRand = props.ampMax ? props.ampMax - ampMin : 0;

    var speedMin = props.speedMin || .001; // not allow 0
    var speedRand = props.speedMax ? props.speedMax - speedMin : 0;

    var force = props.force || 50;

    for(var i = 0, l = vertices.length; i < l; i++) {
      var v = vertices[i];

      v.last = {
        x: v.x,
        y: v.y
      };
      v.curr = {
        x: v.x,
        y: v.y
      };

      if( !static ) {
        v.amp = {
          x: Math.random() * ampRand + ampMin,
          y: Math.random() * ampRand + ampMin
        };
        v.angle = {
          x: Math.random() * 2 * Math.PI,
          y: Math.random() * 2 * Math.PI
        };
        v.speed = {
          x: Math.random() * speedRand + speedMin,
          y: Math.random() * speedRand + speedMin
        };
      }

      v.force = force;

      Object.assign(v, customProps);
    }
  },

  createEdges: function() {
    this.edges = [];

    var i, j, l = this.vertices.length;
    for(i = 0; i < l; i++) {
      var v1 = this.vertices[i];

      for(j = i + 1; j < l; j++) {
        var v2 = this.vertices[j];

        if( v1.border && v2.border ) continue;

        var static = v1.static && v2.static;
        var force = v1.force + v2.force;

        this.edges.push({
          v1: v1,
          v2: v2,
          lastA: 0,
          currA: static ? ( 1 - Math.min(
            Math.sqrt(
              Math.pow(v2.curr.x - v1.curr.x, 2) +
              Math.pow(v2.curr.y - v1.curr.y, 2)
            ) / force,
            1
          ) ) : 0,
          force: force,
          static: static
        });
      }
    }
  },

  setCursor: function(x, y, ctx) {
    this.cursorPoint.curr = {
      x: x,
      y: y
    };

    if( !this.onlyInside || !ctx ) return;

    var firstBorderVertex = this.borderVertices[0];
    ctx.beginPath();
    ctx.moveTo(firstBorderVertex.x, firstBorderVertex.y);
    for(var i = 0, l = this.borderVertices.length; i < l; i++) {
      var v = this.borderVertices[i];
      ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();

    this.cursorPoint.hidden = !ctx.isPointInPath(x, y);
  },

  update: function(delta) {
    for(var i = 0, l = this.vertices.length; i < l; i++) {
      var v = this.vertices[i];

      if( v.static ) continue;

      v.last = {
        x: v.curr.x,
        y: v.curr.y
      };

      v.angle.x += delta * v.speed.x;
      v.angle.y += delta * v.speed.y;

      v.curr = {
        x: v.x + v.amp.x * Math.sin(v.angle.x),
        y: v.y + v.amp.y * Math.cos(v.angle.y)
      };
    }

    for(var i = 0, l = this.edges.length; i < l; i++) {
      var edge = this.edges[i];

      if( edge.static ) continue;

      var v1 = edge.v1;
      var v2 = edge.v2;

      edge.lastA = edge.currA;
      edge.currA = 1 - Math.min(
        Math.sqrt(
          Math.pow(v2.curr.x - v1.curr.x, 2) +
          Math.pow(v2.curr.y - v1.curr.y, 2)
        ) / edge.force,
        1
      );
    }
  },

  render: function(interp, ctx) {
    ctx.lineCap = 'round';

    // border
    ctx.lineWidth = 1;
    ctx.strokeStyle = this.borderStrokeStyle;

    var firstBorderVertex = this.borderVertices[0];
    ctx.beginPath();
    ctx.moveTo(firstBorderVertex.x, firstBorderVertex.y);
    for(var i = 0, l = this.borderVertices.length; i < l; i++) {
      var v = this.borderVertices[i];
      ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
    ctx.stroke();

    // edges
    // ctx.lineWidth = 1; // border set the same width

    for(var i = 0, l = this.edges.length; i < l; i++) {
      var edge = this.edges[i];

      if( edge.currA <= 0 ) continue;

      var v1 = edge.v1;
      var v2 = edge.v2;

      if( v1.hidden || v2.hidden ) continue;

      if( edge.static ) {
        ctx.strokeStyle = 'rgba(255,255,255,' + edge.currA + ')';
      } else {
        ctx.strokeStyle = 'rgba(255,255,255,' + (
          edge.lastA + ( edge.currA - edge.lastA ) * interp
        ) + ')';
      }

      var x1, y1, x2, y2;

      if( v1.static ) {
        x1 = v1.curr.x;
        y1 = v1.curr.y;
      } else {
        x1 = v1.last.x + ( v1.curr.x - v1.last.x ) * interp;
        y1 = v1.last.y + ( v1.curr.y - v1.last.y ) * interp;
      }

      if( v2.static ) {
        x2 = v2.curr.x;
        y2 = v2.curr.y;
      } else {
        x2 = v2.last.x + ( v2.curr.x - v2.last.x ) * interp;
        y2 = v2.last.y + ( v2.curr.y - v2.last.y ) * interp;
      }

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    // vertices
    ctx.strokeStyle = 'rgb(255,255,255)';
    ctx.lineWidth = 3;

    for(var i = 0, l = this.vertices.length; i < l; i++) {
      var v = this.vertices[i];
      var x, y;

      if( v.hidden ) continue;

      if( v.static ) {
        x = v.curr.x;
        y = v.curr.y;
      } else {
        x = v.last.x + ( v.curr.x - v.last.x ) * interp;
        y = v.last.y + ( v.curr.y - v.last.y ) * interp;
      }

      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 0.2, y + 0.2);
      ctx.stroke();
    }
  }

});
/**
 * Orion
 * version: 2018.05.10
 * author: dobrapyra
 * url: https://github.com/dobrapyra/Orion
 */
var Orion = function(props){ this.init(props); };
Object.assign(Orion.prototype, {

  init: function(props) {
    this.viewport = props.viewport;
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    this.fpsMeter = props.fpsMeter;

    this.w = props.w || 1280;
    this.h = props.h || 720;

    this.canvas.width = this.w;
    this.canvas.height = this.h;

    if( props.constellation.onlyInside ) {
      this.offScreenCanvas = this.createOffscreenCanvas();
      this.offscreenCtx = this.offScreenCanvas.getContext('2d');
    }

    this.refreshContext();

    this.loop = new Loop({
      fpsLimit: props.fpsLimit || 36,
      // handleRawFrame: this.rawFrame.bind(this),
      handleUpdate: this.update.bind(this),
      handleRender: this.render.bind(this),
      fpsMeter: !!this.fpsMeter
    });

    this.constellation = new OrionConstellation(props.constellation);

    this.bindEvents();
    this.loop.start();
  },

  createCanvas: function() {
    var canvas = document.createElement('canvas');
    Object.assign(canvas.style, {
      position: 'relative',
      width: '100%',
      height: 'auto'
    });

    this.viewport.appendChild(canvas);
    return canvas;
  },

  createOffscreenCanvas: function() {
    return document.createElement('canvas');
  },

  refreshContext: function() {
    this.scale = Math.round( ( this.canvas.offsetWidth / this.canvas.width ) * 1e5 ) / 1e5;
    this.viewportOffset = this.viewport.getOffset();
  },

  bindEvents: function() {
    this.viewport.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onWinResize.bind(this));
  },

  onMouseMove: function(e) {
    var x = ( e.pageX - this.viewportOffset.l ) / this.scale;
    var y = ( e.pageY - this.viewportOffset.t ) / this.scale;
    this.constellation.setCursor(x, y, this.offscreenCtx);
  },

  onWinResize: function(e) {
    clearTimeout( this.resizeTimeout );
    this.resizeTimeout = setTimeout(this.onResizeTimeout.bind(this), 200);
  },

  onResizeTimeout: function() {
    this.refreshContext();
  },

  // rawFrame: function(){
  //   this.constellation.update(16.67);

  //   this.ctx.clearRect(0, 0, this.w, this.h);
  //   this.constellation.render(1, this.ctx);
  //   if( this.fpsMeter ) {
  //     this.fpsMeter.innerText = Math.round(fps) + ' FPS';
  //   }
  // },

  update: function(delta) {
    this.constellation.update(delta);
  },

  render: function(interp, fps) {
    this.ctx.clearRect(0, 0, this.w, this.h);

    this.constellation.render(interp, this.ctx);

    if( this.fpsMeter ) {
      this.fpsMeter.innerText = Math.round(fps) + ' FPS';
    }
  }

});