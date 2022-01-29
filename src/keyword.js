import stem from 'wink-porter2-stemmer';
import regex from './utils/regex.js';

export default class Keyword {

  _word = '';
  stem = '';
  isHighlighted = false;

  constructor(word) {

    this.word = word;

  }

  //

  get word() {
    return this._word;
  }
  set word(v) {
    this._word = v.replace(regex.noWords, '').trim();
    this.stem = stem(this._word);
  }

}
