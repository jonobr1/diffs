import Two from 'two.js';
import Easing from '../utils/easing.js';
import { styles as defaultStyles } from '../utils/styles.js';
import { palette } from '../utils/colors.js';

var ID = 0;

var styles = { ...defaultStyles,
  fill: palette.white,
  stroke: palette.none,
  padding: 25
};

export default class Group {

  id = ID++;
  object = new Two.Group();

  shape = null;
  text = null;
  tally = null;

  constructor(word, count, color) {

    this.text = new Two.Text(word, 0, styles.size * 0.4, styles);
    this.tally = new Two.Text(count, 0, styles.size * 0.25, styles);
    this.shape = new Two.RoundedRectangle(0, 0, 0, styles.leading, styles.leading * 0.5);
    this.shape.color = color;
    this.shape.stroke = 'none';

    this.text.alignment = 'left';
    this.tally.alignment = 'right';
    this.tally.size *= 0.5;

    this.object.add(this.shape, this.tally, this.text);
    this.object.reference = this;

    this.update();

  }

  update() {

    var word = this.text.value;
    var count = this.tally.value;

    var chars = word.length + count.toString().length;
    var width = chars * styles.characterWidth;

    this.text.position.x = 0;
    this.tally.position.x = width;
    this.shape.position.x = width / 2;
    this.shape.width = width + styles.padding;

  }

  //

  get word() {
    return this.text.value;
  }
  set word(v) {
    this.text.value = v;
    this.update();
  }

  get count() {
    return this.tally.value;
  }
  set count(v) {
    this.tally.value = v;
    this.update();
  }

  get color() {
    return this.shape.fill;
  }
  set color(v) {
    this.shape.fill = v;
  }

}
