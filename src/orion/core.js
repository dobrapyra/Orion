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