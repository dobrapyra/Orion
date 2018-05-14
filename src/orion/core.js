/*! Orion - core */
var Orion = function(props){ this.init(props); };
Object.assign(Orion.prototype, {

  init: function(props) {
    this.viewport = props.viewport;
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    this.eventHandler = props.eventHandler || props.viewport;

    this.fpsMeter = props.fpsMeter;

    this.density = props.density || 1;

    this.w = ( props.w || 1280 ) * this.density;
    this.h = ( props.h || 720 ) * this.density;

    this.canvas.width = this.w;
    this.canvas.height = this.h;

    if( props.constellation.onlyInside ) {
      this.offScreenCanvas = this.createOffscreenCanvas();
      this.offscreenCtx = this.offScreenCanvas.getContext('2d');
    }

    this.refresh();

    this.loop = new Loop({
      fpsLimit: props.fpsLimit || 36,
      // handleRawFrame: this.rawFrame.bind(this),
      handleUpdate: this.update.bind(this),
      handleRender: this.render.bind(this),
      fpsMeter: !!this.fpsMeter
    });

    this.constellation = new OrionConstellation(
      this.prepareConstellation( props.constellation )
    );

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

  prepareConstellation: function(constellation) {
    var points = constellation.points || {};

    return Object.assign(
      constellation,
      {
        points: {
          border: this.recalcPoints(points.border),
          inside: this.recalcPoints(points.inside),
        }
      }
    );
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

  refresh: function() {
    this.offset = this.viewport.getBoundingClientRect();

    var viewportScale = this.offset.width / this.viewport.offsetWidth;
    this.scale = Math.round( (
      ( this.canvas.offsetWidth / this.canvas.width ) * viewportScale
    ) * 1e5 ) / 1e5;
  },

  bindEvents: function() {
    this.eventHandler.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onWinResize.bind(this));
  },

  onMouseMove: function(e) {
    var x = ( e.pageX - this.offset.x ) / this.scale;
    var y = ( e.pageY - this.offset.y ) / this.scale;
    this.constellation.setCursor(x, y, this.offscreenCtx);
  },

  onWinResize: function(e) {
    clearTimeout( this.resizeTimeout );
    this.resizeTimeout = setTimeout(this.onResizeTimeout.bind(this), 200);
  },

  onResizeTimeout: function() {
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