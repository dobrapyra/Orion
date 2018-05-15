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