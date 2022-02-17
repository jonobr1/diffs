import stem from 'wink-porter2-stemmer';
import regex from './utils/regex.js';

var registry = {};

export default class Keyword {

  index = 0;
  _word = '';
  stem = '';
  isHighlighted = false;

  constructor(index, word) {
    this.index = index;
    this.word = word;
  }

  static dispose(keywords) {
    if (typeof keywords === 'undefined') {
      registry = {};
      return;
    }
    if (Array.isArray(keywords)) {
      keywords.forEach(function(keyword) {
        if (keyword.stem in registry) {
          registry[keyword.stem]--;
        }
      });
    }
  }

  //

  get frequency() {
    return registry[this.stem];
  }

  get word() {
    return this._word;
  }
  set word(v) {
    if (this.stem in registry) {
      registry[this.stem]--;
    }
    this._word = v
      .replace(regex.contractions, '')
      .replace(regex.noWords, '')
      .trim();
    this.stem = stem(this._word);
    if (!(this.stem in registry)) {
      registry[this.stem] = 0;
    }
    registry[this.stem]++;
  }

}
