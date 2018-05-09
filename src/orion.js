var Orion = function(props){ this.init(props); };
Object.assign(Orion.prototype, {

  init: function(props) {
    this.fpsMeter = document.getElementById('fps');

    this.viewport = document.getElementById('viewport');
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    this.w = props.w || 1280;
    this.h = props.h || 720;
    this.fpsShow = props.fpsShow || false;

    this.canvas.width = this.w;
    this.canvas.height = this.h;

    this.refreshContext();

    this.loop = new Loop({
      fpsLimit: 33,
      // handleRawFrame: this.rawFrame.bind(this),
      handleUpdate: this.update.bind(this),
      handleRender: this.render.bind(this),
      fpsMeter: this.fpsShow
    });

    this.constelation = new Constelation();

    this.bindEvents();
    this.loop.start();
  },

  createCanvas: function() {
    var canvas = document.createElement('canvas');
    canvas.id = 'canvas';
    this.viewport.appendChild(canvas);
    return canvas;
  },

  refreshContext: function() {
    this.scale = Math.round( ( this.canvas.offsetWidth / this.canvas.width ) * 1e5 ) / 1e5;
  },

  // rawFrame: function(){
  //   this.constelation.update(16.67);

  //   this.ctx.clearRect(0, 0, this.w, this.h);
  //   this.constelation.render(1, this.ctx);
  //   this.fpsMeter.innerText = Math.round(fps) + ' FPS';
  // },

  bindEvents: function() {
    this.viewport.addEventListener('mousemove', this.onMouseMove.bind(this));
    window.addEventListener('resize', this.onWinResize.bind(this));
  },

  onMouseMove: function(e) {
    var x = ( e.pageX - this.viewport.offsetLeft ) / this.scale;
    var y = ( e.pageY - this.viewport.offsetTop ) / this.scale;
    this.constelation.setCursor(x, y);
  },

  onWinResize: function(e) {
    clearTimeout( this.resizeTimeout );
    this.resizeTimeout = setTimeout(this.onResizeTimeout.bind(this), 200);
  },

  onResizeTimeout: function() {
    this.refreshContext();
  },

  update: function(delta) {
    this.constelation.update(delta);
  },

  render: function(interp, fps) {
    this.ctx.clearRect(0, 0, this.w, this.h);

    this.constelation.render(interp, this.ctx);

    if( this.fpsShow ) {
      this.fpsMeter.innerText = Math.round(fps) + ' FPS';
    }
  }

});