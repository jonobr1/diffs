import Two from 'two.js';
import Easing from '../utils/easing.js';
import { styles as defaultStyles } from '../utils/styles.js';
import { palette } from '../utils/colors.js';

var styles = { ...defaultStyles,
  fill: palette.white,
  stroke: palette.none,
  padding: defaultStyles.leading
};

export default class StatLine extends Two.Group {

  userData = {};

  constructor(keyword, count, color) {

    var shape, tally, text;

    super();

    text = new Two.Text(keyword.word, 0, styles.size * 0.33, styles);
    tally = new Two.Text(count, 0, styles.size * 0.25, styles);
    shape = new Two.RoundedRectangle(0, 0, 0, styles.leading, styles.leading * 0.5);
    shape.color = color;
    shape.stroke = 'none';
    shape.linewidth = styles.size * 0.25;

    text.alignment = 'left';
    tally.alignment = 'right';
    tally.size *= 0.5;

    this.add(shape, tally, text);

    this.userData = {
      shape, tally, text, keyword
    };

    this.update();

  }

  update() {

    var { keyword, shape, tally, text } = this.userData;
    var word = text.value;
    var count = tally.value;

    var chars = (word.length + 1) + count.toString().length;
    var width = chars * styles.characterWidth;


    this.className = `sl ${keyword.stem}`;

    text.position.x = 0;
    tally.position.x = width;
    shape.position.x = width / 2;
    shape.width = width + styles.padding;

    if (keyword.isHighlighted) {
      shape.stroke = 'yellow';
      this.className += ' highlight';
    } else {
      shape.stroke = 'none';
    }

  }

  //

  get keyword() {
    return this.userData.keyword;
  }
  set keyword(v) {
    this.userData.keyword = v;
    this.userData.text.value = v.word;
    this.update();
  }

  get count() {
    return this.userData.tally.value;
  }
  set count(v) {
    this.userData.tally.value = v;
    this.update();
  }

  get color() {
    return this.userData.shape.fill;
  }
  set color(v) {
    this.userData.shape.fill = v;
  }

  get isHighlighted() {
    return this.userData.keyword.isHighlighted;
  }
  set isHighlighted(v) {
    this.userData.keyword.isHighlighted = !!v;
    this.update();
  }

}
