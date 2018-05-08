var Orion = function(){ this.init(); };
Object.assign(Orion.prototype, {

  init: function() {
    this.fpsMeter = document.getElementById('fps');

    this.viewport = document.getElementById('viewport');
    this.canvas = this.createCanvas();
    this.ctx = this.canvas.getContext('2d');

    this.refreshContext();

    this.loop = new Loop({
      fpsLimit: 33,
      // handleRawFrame: this.rawFrame.bind(this),
      handleUpdate: this.update.bind(this),
      handleRender: this.render.bind(this),
      fpsMeter: true
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
    this.w = this.viewport.offsetWidth;
    this.h = this.viewport.offsetHeight;

    this.canvas.width = this.w;
    this.canvas.height = this.h;
  },

  // rawFrame: function(){
  //   this.constelation.update(16.67);

  //   this.ctx.clearRect(0, 0, this.w, this.h);
  //   this.constelation.render(1, this.ctx);
  //   this.fpsMeter.innerText = Math.round(fps) + ' FPS';
  // },

  bindEvents: function() {
    this.viewport.addEventListener('mousemove', this.onMouseMove.bind(this));
  },

  onMouseMove: function(e) {
    var x = e.pageX - this.viewport.offsetLeft;
    var y = e.pageY - this.viewport.offsetTop;
    this.constelation.setCursor(x, y);
  },

  update: function(delta) {
    this.constelation.update(delta);
  },

  render: function(interp, fps) {
    this.ctx.clearRect(0, 0, this.w, this.h);

    this.constelation.render(interp, this.ctx);

    this.fpsMeter.innerText = Math.round(fps) + ' FPS';
  }

});

var orion = new Orion();