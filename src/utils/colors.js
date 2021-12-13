function random(min, max) {
  if (typeof min !== 'number') {
    min = 0;
  }
  if (typeof max !== 'number') {
    max = 255;
  }
  var range = max - min;
  var red = Math.floor(Math.random() * range + min);
  var green = Math.floor(Math.random() * range + min);
  var blue = Math.floor(Math.random() * range + min);
  return `rgb(${red}, ${green}, ${blue})`;
}

export { random };
