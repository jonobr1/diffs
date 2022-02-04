import Two from 'two.js';

export class Arc extends Two.Path {

  _flagRadius = false;
  _flagStartAngle = false;
  _flagEndAngle = false;

  _radius = 0;
  _startAngle = 0;
  _endAngle = 0;

  constructor(x, y, radius, startAngle, endAngle, resolution) {

    if (typeof resolution !== 'number') {
      resolution = Two.Resolution;
    }

    var points = [];
    for (var i = 0; i < resolution; i++) {
      points.push(new Two.Anchor());
    }

    super(points);

    for (var j = 0; j < Arc.Properties.length; j++) {
      var prop = Arc.Properties[j];
      Object.defineProperty(this, prop, protos[prop]);
    }

    this.curved = true;

    if (typeof x === 'number') {
      this.position.x = x;
    }
    if (typeof y === 'number') {
      this.position.y = y;
    }

    if (typeof radius === 'number') {
      this.radius = radius;
    }
    if (typeof startAngle === 'number') {
      this.startAngle = startAngle;
    }
    if (typeof endAngle === 'number') {
      this.endAngle = endAngle;
    }

    this._update();

  }

  static Properties = ['radius', 'startAngle', 'endAngle'];

  _update() {

    if (this._flagVertices || this._flagRadius || this._flagStartAngle
      || this._flagEndAngle) {

      var vertices = this.vertices;
      var radius = this._radius;
      var startAngle = this._flagStartAngle;
      var endAngle = this._endAngle;

      for (var i = 0; i < vertices.length; i++) {

        var v = vertices[i];
        var pct = i / (vertices.length - 1);
        var theta = pct * (endAngle - startAngle) + startAngle;

        v.x = radius * Math.cos(theta);
        v.y = radius * Math.sin(theta);

      }

    }

    super._update.call(this);

    return this;

  }

  flagReset() {

    super.flagReset.call(this);

    this._flagRadius = this._flagStartAngle = this._flagEndAngle = false;

    return this;

  }

};

var protos = {
  radius: {
    enumerable: true,
    get: function() {
      return this._radius;
    },
    set: function(v) {
      if (v !== this._radius) {
        this._radius = v;
        this._flagRadius = true;
      }
    }
  },
  startAngle: {
    enumerable: true,
    get: function() {
      return this._startAngle;
    },
    set: function(v) {
      if (v !== this._startAngle) {
        this._startAngle = v;
        this._flagStartAngle = true;
      }
    }
  },
  endAngle: {
    enumerable: true,
    get: function() {
      return this._endAngle;
    },
    set: function(v) {
      if (v !== this._endAngle) {
        this._endAngle = v;
        this._flagEndAngle = true;
      }
    }
  }
}
