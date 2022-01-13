import utils from 'less/lib/less/functions/color.js';

var palette = {
  white: '#fff',
  black: '#000',
  none: 'transparent'
};

function random(min, max) {
  if (typeof min !== 'number') {
    min = 0;
  }
  if (typeof max !== 'number') {
    max = 1;
  }
  var h = Math.floor(Math.random() * 360);
  var s = 1;
  var l = Math.random() * (max - min) + min;
  var hsl = utils.hsl(h, s, l);
  var r = Math.floor(hsl.rgb[0]);
  var g = Math.floor(hsl.rgb[1]);
  var b = Math.floor(hsl.rgb[2]);
  return `rgb(${r},${g},${b})`;
}

export { random, palette };
