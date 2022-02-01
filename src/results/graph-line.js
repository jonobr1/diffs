import Two from 'two.js';

export default class GraphLine extends Two.Group {

  userData = {};

  constructor() {

    var line, points, highlights;

    super();

    line = new Two.Line();
    line.stroke = '#777';

    points = new Two.Points(line.vertices);
    points.size = 4;
    points.fill = '#777';
    points.stroke = 'none';

    highlights = new Two.Points();
    highlights.size = 12;
    highlights.fill = 'yellow';
    highlights.stroke = 'none';

    this.add(line, highlights, points);

    this.userData = {
      line, highlights, points
    };

  }

  addPoint(v) {
    if (this.userData.points) {
      this.userData.points.vertices.push(v);
    }
  }

  addHighlight(v) {
    if (this.userData.highlights) {
      this.userData.highlights.vertices.push(v);
    }
  }

  clearHighlights() {
    if (this.userData.highlights) {
      this.userData.highlights.vertices = [];
    }
  }

  reset() {
    var line = this.userData.line;
    if (line) {
      line.vertices[0].clear();
      line.vertices[1].clear();
    }
    var points = this.userData.points;
    if (points && line) {
      points.vertices = points.vertices.slice(0, 2);
    }
  }

  //

  get top() {
    if (this.userData.line) {
      return this.userData.line.vertices[0].y;
    } else {
      return 0;
    }
  }
  set top(v) {
    if (this.userData.line) {
      this.userData.line.vertices[0].y = v;
    }
  }
  get bottom() {
    if (this.userData.line) {
      return line.vertices[1].y;
    } else {
      return 0;
    }
  }
  set bottom(v) {
    if (this.userData.line) {
      this.userData.line.vertices[1].y = v;
    }
  }

}
