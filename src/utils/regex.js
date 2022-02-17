import { all } from './string.js';

var regex = {
  contractions: /[\'\’]\w*$/i,
  noWords: /[^\w\-\_]+/ig,
  restricted: new RegExp(`^(${all.join('|')})$`, 'i')
};

export default regex;
