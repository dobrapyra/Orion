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
    this.quickDetect = constellation.quickDetect || 0.02;
    this.outsideDetect = Object.assign( {
      border: 0,
      inside: 1,
      cursor: 3
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

        var static = !!( v1.static && v2.static );
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

        if( v1.border || v2.border ) {
          if( this.quickDetect > 0 ) {
            edge.quickDetect = true;
          }
          edgeType = 'border';
        }

        if( v1.cursor || v2.cursor ) {
          edgeType = 'cursor';
        }

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

    if( !this.onlyInside ) return;

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

  edgeQuickDetect: function(edge, ctx) {
    var v1 = edge.v1.curr;
    var v2 = edge.v2.curr;

    var t = {
      x: ( v2.x - v1.x ) * this.quickDetect,
      y: ( v2.y - v1.y ) * this.quickDetect
    };

    if( edge.v1.border ) {
      edge.hidden = !ctx.isPointInPath(
        v1.x + t.x,
        v1.y + t.y
      );
    } else { // if edge.v1.border
      edge.hidden = !ctx.isPointInPath(
        v2.x - t.x,
        v2.y - t.y
      );
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

      if( edge.static ) continue;

      if( this.onlyInside ) {
        if( edge.quickDetect ) {
          this.edgeQuickDetect(edge, ctx);
          if( edge.hidden ) continue;
        }

        this.edgeOutsideDetect(edge, ctx);
        if( edge.hidden ) continue;
      }

      edge.hidden = !!( edge.v1.hidden || edge.v2.hidden );
      if( edge.hidden ) continue;

      var v1 = edge.v1.curr;
      var v2 = edge.v2.curr;

      edge.lastA = edge.currA;
      edge.currA = 1 - Math.min(
        Math.sqrt(
          Math.pow(v2.x - v1.x, 2) +
          Math.pow(v2.y - v1.y, 2)
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