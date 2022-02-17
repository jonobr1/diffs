import { all } from './string.js';

var regex = {
  contractions: /[\'\’].*$/i,
  noWords: /[^\w\-\_]+/ig,
  restricted: new RegExp(`^(${all.join('|')})$`, 'i')
};

export default regex;
