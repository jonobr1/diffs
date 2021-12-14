import Two from 'two.js';

var styles = {
  family: 'Arial',
  size: 17,
  leading: 25,
  fill: '#fff',
  stroke: 'transparent'
};

export default class Group {

  object = new Two.Group();
  velocity = new Two.Vector();

  circle = null;
  destination = null;
  speed = 100;

  constructor(word, color, destination) {

    this.destination = destination;
    this.circle = new Two.Circle(0, 0, 0);
    this.text = new Two.Text(word, 0, 0, styles);

    this.circle.fill = color;
    this.circle.stroke = color;
    this.circle.linewidth = styles.size * 0.5;

    this.object.add(this.circle, this.text);

    var theta = Math.random() * Math.PI * 2;
    var rad = styles.leading * 10;
    var ox = rad * Math.cos(theta) + destination.x;
    var oy = rad * Math.sin(theta) + destination.y;
    this.object.position.set(ox, oy);

  }

  update() {

    var dest = this.destination;
    var source = this.object.position;

    var theta = Two.Vector.angleBetween(dest, source);
    var step = this.speed;
    var x = step * Math.cos(theta);
    var y = step * Math.sin(theta);

    this.velocity.x += (x - this.velocity.x) * 0.01;
    this.velocity.y += (y - this.velocity.y) * 0.01;

    this.object.position.add(this.velocity);
    this.circle.radius = this.text.value.length * 5;

    return this;

  }

  repel(v) {

    var source = this.object.position;
    var theta = Two.Vector.angleBetween(v, source);
    var rad = this.circle.radius * 0.01;
    var x = rad * Math.cos(theta);
    var y = rad * Math.sin(theta);

    this.object.position.sub(x, y);

    return this;

  }

  dispose() {

    this.circle.unbind();
    this.circle.position.unbind();
    this.circle.vertices.unbind();

    this.text.unbind();
    this.text.position.unbind();

    this.object.remove(this.circle, this.text);
    this.object.remove();

    this.object.unbind();
    this.object.position.unbind();
    this.object.children.unbind();

    this.destination = null;
    this.object = null;
    this.text = null
    this.circle = null;

  }

  //

  get word() {
    return this.text.value;
  }
  set word(v) {
    this.text.value = v;
  }

}
