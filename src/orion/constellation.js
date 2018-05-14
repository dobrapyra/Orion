/*! Orion - constellation */
var OrionConstellation = function(props){ this.init(props); };
Object.assign(OrionConstellation.prototype, {

  init: function(props) {
    var points = props.points || {};
    var force = props.force || {};
    var amplitude = props.amplitude || {};
    var speed = props.speed || {};
    var opacity = props.opacity || {};

    this.onlyInside = props.onlyInside || false;
    this.edgeTestPoints = props.edgeTestPoints || 7;

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
      cursor: true,
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
    this.cursorEdges = [];

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

        this.edges.push(edge);
        if( v1.cursor || v2.cursor ) this.cursorEdges.push(edge);
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

    var k = this.edgeTestPoints + 1;
    for(var i = 0, l = this.cursorEdges.length; i < l; i++) {
      var edge = this.cursorEdges[i];

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