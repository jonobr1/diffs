import Two from 'two.js';
import { styles as defaultStyles } from './utils/styles.js';
import { palette } from './utils/colors.js';

var styles = {
  ...defaultStyles,
  fill: palette.black,
  stroke: palette.none,
  alignment: 'left'
};

class Line {

  group = new Two.Group();
  text = new Two.Text('', styles.size * 2, 0, styles);
  symbol = new Two.Circle(styles.size, 0, styles.size / 3);

  constructor() {
    this.symbol.noStroke();
    this.group.add(this.text, this.symbol);
    this.group.dispose = this.dispose.bind(this);
  }

  dispose() {

    this.group.remove(this.symbol, this.text);

    this.text.unbind();
    this.text.position.unbind();
    this.text = null;

    this.symbol.unbind();
    this.symbol.position.unbind();
    this.symbol.vertices.unbind();
    this.symbol = null;

    this.group.remove();
    this.group.unbind();
    this.group = null;

  }

  //

  get position() {
    return this.group.position;
  }

  get value() {
    return this.text.value;
  }
  set value(v) {
    this.text.value = v;
  }

  get fill() {
    return this.symbol.fill;
  }
  set fill(v) {
    this.symbol.fill = v;
  }

}

export default class Legend {

  props = null;
  group = new Two.Group();

  constructor(props) {

    if (typeof props === 'object' && props.length > 0) {
      this.props = props;
      this.update();
    }

  }

  update() {

    if (!(typeof this.props === 'object' && this.props.length > 0)) {
      return;
    }

    this.group.remove(this.group.children);

    var count = this.props.length + 1;

    for (var i = 0; i < this.props.length; i++) {

      var j = count - i;
      var prop = this.props[i];
      var child = this.group.children[i];

      child = new Line();
      this.group.add(child.group);
      child.value = prop.name || `Text ${i + 1}`;
      child.fill = prop.color;
      child.position.y = - j * styles.leading;

    }

    i++

    child = new Line();
    this.group.add(child.group);
    child.position.y = - styles.leading;
    child.value = this.props.registry.name || `Shared Words`;
    child.fill = this.props.registry.color;

  }

  dispose() {
    for (var i = 0; i < this.group.children.length; i++) {
      var child = this.group.children[i];
      if (child.dispose) {
        child.dispose();
      }
    }
    this.group.remove();
    this.group.unbind();
    this.group.position.unbind();
    this.group.children.unbind();
    this.group = null;
  }

}
