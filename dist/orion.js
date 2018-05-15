/*!
 * Orion
 * version: 2018.05.15
 * author: dobrapyra
 * url: https://github.com/dobrapyra/Orion
 */
/*! Polyfills - https://github.com/dobrapyra/EasyPure */
/**
 * Object.keys from EasyPure by dobrapyra
 * date: 2018.05.10
 * url: https://github.com/dobrapyra/EasyPure/blob/master/src/polyfills/Object/keys.js
 */
Object.keys || (
  Object.keys = function( obj ) {

    if( obj !== Object( obj ) ) throw new TypeError( 'Object.keys called on a non-object' );

    var keysArr = [], key;

    for( key in obj ) {
      if( obj.hasOwnProperty( key ) ) keysArr.push( key );
    }

    return keysArr;
  }
);
/**
 * Object.assign from EasyPure by dobrapyra
 * date: 2018.05.10
 * url: https://github.com/dobrapyra/EasyPure/blob/master/src/polyfills/Object/assign.js
 */
Object.assign || (
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
  }
);
/**
 * GameLoop
 * version: 2018.05.10
 * author: dobrapyra
 * url: https://github.com/dobrapyra/GameLoop
 */
/*! GameLoop - https://github.com/dobrapyra/GameLoop */
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
/*! Orion - constellation */
var OrionConstellation = function(props){ this.init(props); };
Object.assign(OrionConstellation.prototype, {

  init: function(props) {
    var constellation = props.constellation || {};

    var points = constellation.points || {};
    var force = constellation.force || {};
    var amplitude = constellation.amplitude || {};
    var speed = constellation.speed || {};
    var opacity = constellation.opacity || {};
    var lineWidth = constellation.lineWidth || {};
    var dotSize = constellation.dotSize || {};

    var density = this.density = props.density || 1;

    this.onlyInside = constellation.onlyInside || false;
    this.outsideDetect = Object.assign( {
      border: 3,
      inside: 5,
      cursor: 9
    }, constellation.outsideDetect );

    this.borderVertices = Object.assign( [], this.recalcPoints(points.border) );
    this.prepareVertices( this.borderVertices, {
      force: ( force.border || 60 ) * density,
      dotSize: ( dotSize.border || 3 ) / 2 * density
    }, {
      static: true,
      border: true
    } );

    this.insideVertices = Object.assign( [], this.recalcPoints(points.inside) );
    this.prepareVertices( this.insideVertices, {
      ampMin: amplitude.min * density,
      ampMax: amplitude.max * density,
      speedMin: speed.min,
      speedMax: speed.max,
      force: ( force.inside || 40 ) * density,
      dotSize: ( dotSize.inside || 3 ) / 2 * density
    } );

    this.cursorPoint = {
      curr: {
        x: 0,
        y: 0
      },
      cursor: true,
      hidden: this.onlyInside ? true : false,
      force: ( force.cursor || 120 ) * density,
      dotSize: ( dotSize.cursor || 3 ) / 2 * density
    };

    this.vertices = [].concat( this.borderVertices, this.insideVertices );
    this.vertices.push( this.cursorPoint );

    this.createEdges();

    this.cursorPoint.static = true; // after createEdges

    this.lineWidth = {
      border: ( lineWidth.border || 1 ) * density,
      inside: ( lineWidth.inside || 1 ) * density
    };

    this.borderStrokeStyle = 'rgba(255,255,255,' + (
      opacity.border !== undefined ? opacity.border : 0.5
    ) + ')';
  },

  recalcPoints: function(points) {
    var density = this.density;

    return density !== 1 ? points.map( function(point) {
      return {
        x: point.x * density,
        y: point.y * density
      };
    } ) : points;
  },

  prepareVertices: function(vertices, props, customProps) {
    var static = customProps && customProps.static ? true : false;

    var ampMin = props.ampMin !== undefined ? props.ampMin : 10; // allow 0
    var ampRand = props.ampMax ? props.ampMax - ampMin : 0;

    var speedMin = props.speedMin || .001; // not allow 0
    var speedRand = props.speedMax ? props.speedMax - speedMin : 0;

    var force = props.force || 50;
    var dotSize = props.dotSize || 3;

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
      v.dotSize = dotSize;

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

        // skip border edge in dynamic calculations
        if( v1.border && v2.border ) continue;

        var static = v1.static && v2.static;
        var force = v1.force + v2.force;

        var edge = {
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
        };

        var edgeType = 'inside';
        if( v1.border || v2.border ) edgeType = 'border';
        if( v1.cursor || v2.cursor ) edgeType = 'cursor';

        edge.outsideDetect = ( this.outsideDetect[edgeType] || 0 ) + 1;

        this.edges.push(edge);
      }
    }
  },

  setOutsideDetector: function(ctx) {
    var firstBorderVertex = this.borderVertices[0];
    ctx.beginPath();
    ctx.moveTo(firstBorderVertex.x, firstBorderVertex.y);
    for(var i = 0, l = this.borderVertices.length; i < l; i++) {
      var v = this.borderVertices[i];
      ctx.lineTo(v.x, v.y);
    }
    ctx.closePath();
  },

  setCursor: function(x, y, ctx) {
    this.cursorPoint.curr = {
      x: x,
      y: y
    };

    if( !this.onlyInside || !ctx ) return;

    this.cursorPoint.hidden = !ctx.isPointInPath(x, y);
  },

  edgeOutsideDetect: function(edge, ctx) {
    var k = edge.outsideDetect;
    if( k === 1 ) return;

    var v1 = edge.v1.curr;
    var v2 = edge.v2.curr;

    var t = {
      x: ( v2.x - v1.x ) / k,
      y: ( v2.y - v1.y ) / k
    };

    for(var j = 1; j < k; j++) {
      if( edge.hidden = !ctx.isPointInPath(
        v1.x + ( j * t.x ),
        v1.y + ( j * t.y )
      ) ) break;
    }
  },

  update: function(delta, ctx) {
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

      if( this.onlyInside ) {
        this.edgeOutsideDetect(edge, ctx);
      }

      if( edge.hidden || edge.static ) continue;

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
    ctx.lineWidth = this.lineWidth.border;
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
    if( this.lineWidth.inside !== this.lineWidth.border ){
      ctx.lineWidth = this.lineWidth.inside;
    }

    for(var i = 0, l = this.edges.length; i < l; i++) {
      var edge = this.edges[i];

      if( edge.hidden || edge.currA <= 0 ) continue;

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
    ctx.fillStyle = 'rgb(255,255,255)';
    var PI2 = 2 * Math.PI;

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
      ctx.arc(x, y, v.dotSize, 0, PI2);
      ctx.fill();
    }
  }

});
/*! Orion - core */
var Orion = function(props){ this.init(props); };
Object.assign(Orion.prototype, {

  init: function(props) {
    this.viewport = props.viewport;
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    this.eventHandler = props.eventHandler || props.viewport;

    this.fpsMeter = props.fpsMeter || null;

    var density = props.density || 1;

    this.w = ( props.w || 1280 ) * density;
    this.h = ( props.h || 720 ) * density;

    this.canvas.width = this.w;
    this.canvas.height = this.h;

    this.refresh();

    this.loop = new Loop( {
      fpsLimit: props.fpsLimit || 36,
      // handleRawFrame: this.rawFrame.bind(this),
      handleUpdate: this.update.bind(this),
      handleRender: this.render.bind(this),
      fpsMeter: !!this.fpsMeter
    } );

    this.constellation = new OrionConstellation( {
      constellation: props.constellation,
      density: density
    } );

    if( props.constellation.onlyInside ) {
      this.offScreenCanvas = this.createOffscreenCanvas();
      this.offscreenCtx = this.offScreenCanvas.getContext('2d');
      this.constellation.setOutsideDetector( this.offscreenCtx );
    }

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

  refresh: function() {
    this.offset = this.viewport.getBoundingClientRect();

    this.scroll = {
      top: window.scrollY || window.pageYOffset ||
        document.body.scrollTop || document.documentElement.scrollTop || 0,
      left: window.scrollX || window.pageXOffset ||
        document.body.scrollLeft || document.documentElement.scrollLeft || 0
    };

    var viewportScale = this.offset.width / this.viewport.offsetWidth;
    this.scale = Math.round( (
      ( this.canvas.offsetWidth / this.canvas.width ) * viewportScale
    ) * 1e5 ) / 1e5;
  },

  bindEvents: function() {
    this.eventHandler.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.callRefresh.bind(this));
    document.addEventListener('scroll', this.callRefresh.bind(this));
  },

  onMouseMove: function(e) {
    var x = ( e.pageX - this.offset.left - this.scroll.left ) / this.scale;
    var y = ( e.pageY - this.offset.top - this.scroll.top ) / this.scale;
    this.constellation.setCursor(x, y, this.offscreenCtx);
  },

  callRefresh: function(e) {
    clearTimeout( this.refresfTimeout );
    this.refresfTimeout = setTimeout(this.onRefreshTimeout.bind(this), 100);
  },

  onRefreshTimeout: function() {
    this.refresh();
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
    this.constellation.update(delta, this.offscreenCtx);
  },

  render: function(interp, fps) {
    this.ctx.clearRect(0, 0, this.w, this.h);

    this.constellation.render(interp, this.ctx);

    if( this.fpsMeter ) {
      this.fpsMeter.innerText = Math.round(fps) + ' FPS';
    }
  }

});