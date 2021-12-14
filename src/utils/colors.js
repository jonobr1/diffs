import utils from 'less/lib/less/functions/color.js';

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
  return hsl.toCSS();
}

export { random };
