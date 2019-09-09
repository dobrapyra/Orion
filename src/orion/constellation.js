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

        this.edges.push(edge);
      }
    }
  },

  setCursor: function(x, y) {
    this.cursorPoint.curr = {
      x: x,
      y: y
    };

    if( !this.onlyInside ) return;

    this.cursorPoint.hidden = this.cursorOutsideDetect(x, y);
  },

  intersection: function(ax, ay, bx, by, cx, cy, dx, dy) { // based on http://jsfiddle.net/justin_c_rounds/Gd2S2/light/
    var s, t,
      ab_x = bx - ax, ab_y = by - ay,
      cd_x = dx - cx, cd_y = dy - cy,
      ca_x, ca_y,
      denominator = (cd_y * ab_x) - (cd_x * ab_y)
      // result = {
      //   // point: null,
      //   intersect: false
      // }
    ;

    if (denominator === 0) { // parallel
      // return result;
      return false;
    }

    ca_x = ax - cx;
    ca_y = ay - cy;
    s = ((cd_x * ca_y) - (cd_y * ca_x)) / denominator;
    t = ((ab_x * ca_y) - (ab_y * ca_x)) / denominator;

    // result.point = new Vector(
    //   ax + (s * (bx - ax)),
    //   ay + (s * (by - ay))
    // );

    if ( (s > 0 && s < 1) && (t > 0 && t < 1) ) { // onLine1 && onLine2
      return true;
      // result.intersect = true;

      // result.point = new Vector(
      //   ax + (s * (bx - ax)),
      //   ay + (s * (by - ay))
      // );
    }

    // return result;
    return false;
  },

  cursorOutsideDetect: function(x, y) {
    var bv1, bv2;

    inter = 0;
    for( j = 0, k = this.borderVertices.length; j < k; j++ ) {
      bv1 = j === 0 ? this.borderVertices[k - 1] : this.borderVertices[j - 1];
      bv2 = this.borderVertices[j];

      if( this.intersection( bv1.x, bv1.y, bv2.x, bv2.y, -1, -1, x, y ) ) inter++;
    }

    return (inter % 2 === 0);
  },

  edgeOutsideDetect: function(edge) {
    var v1 = edge.v1.curr;
    var v2 = edge.v2.curr;

    var bv1, bv2;

    inter = 0;
    for( j = 0, k = this.borderVertices.length; j < k; j++ ) {
      bv1 = j === 0 ? this.borderVertices[k - 1] : this.borderVertices[j - 1];
      bv2 = this.borderVertices[j];

      if( this.intersection( bv1.x, bv1.y, bv2.x, bv2.y, v1.x, v1.y, v2.x, v2.y ) ) {
        edge.hidden = true;
        return;
      }
    }
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

      edge.hidden = !!( edge.v1.hidden || edge.v2.hidden );
      if( edge.hidden ) continue;

      var v1 = edge.v1.curr;
      var v2 = edge.v2.curr;

      var d = {
        x: Math.abs( v2.x - v1.x ),
        y: Math.abs( v2.y - v1.y )
      };

      edge.hidden = !!( d.x > edge.force || d.y > edge.force );
      if( edge.hidden ) continue;

      if( this.onlyInside ) {
        this.edgeOutsideDetect(edge);
        if( edge.hidden ) continue;
      }

      edge.lastA = edge.currA;
      edge.currA = 1 - Math.min(
        Math.sqrt( d.x * d.x + d.y * d.y ) / edge.force,
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