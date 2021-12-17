import Two from 'two.js';
import Matter from 'matter-js';
import Easing from './utils/easing.js';
import { styles as defaultStyles } from './utils/styles.js';
import { palette } from './utils/colors.js';

var ID = 0;

var styles = { ...defaultStyles,
  fill: palette.white,
  stroke: palette.none
};

export default class Group {

  id = ID++;
  object = new Two.Group();
  velocity = new Two.Vector();
  life = 1;

  engine = null;
  circle = null;
  destination = null;
  speed = 100;

  constructor(engine, word, color, destination) {

    this.engine = engine;
    this.destination = destination;

    this.body = Matter.Bodies.circle(0, 0, 0.5);
    this.body.friction = 0.7;

    this.circle = new Two.Circle(0, 0, 0.5);
    this.text = new Two.Text(word, 0, 0, styles);

    this.circle.fill = color;
    this.circle.noStroke();

    this.object.add(this.circle, this.text);

    var theta = Math.random() * Math.PI * 2;
    var rad = styles.leading * 10;
    var x = rad * Math.cos(theta) + destination.x;
    var y = rad * Math.sin(theta) + destination.y;

    this.body.position = this.object.position;

    Matter.Body.setPosition(this.body, { x, y });
    Matter.Composite.add(this.engine.world, this.body);

  }

  update() {

    var scale;
    var dest = this.destination;
    var source = this.object.position;
    var height = window.innerHeight;

    var theta = Two.Vector.angleBetween(dest, source);
    var delta = Math.min(Math.max(dest.distanceTo(source), 0), height);
    var step = this.speed * Easing.Exponential.In(delta / height);
    var x = step * Math.cos(theta);
    var y = step * Math.sin(theta);

    this.velocity.x += x;
    this.velocity.y += y;

    this.velocity.x *= this.life;
    this.velocity.y *= this.life;

    Matter.Body.setVelocity(this.body, this.velocity);

    this.object.rotation = this.body.angle;
    this.life *= 0.95;

    return this;

  }

  dispose() {

    Matter.Composite.remove(this.engine.world, this.body);

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

  get scale() {
    return this.circle.radius * 2;
  }
  set scale(v) {

    var scale;

    scale = 1 / (this.circle.radius * 2);
    Matter.Body.scale(this.body, scale, scale);

    this.circle.radius = v;

    scale = this.circle.radius * 2;
    Matter.Body.scale(this.body, scale, scale);

  }

  get color() {
    return this.circle.fill;
  }
  set color(v) {
    this.circle.fill = v;
  }

}
