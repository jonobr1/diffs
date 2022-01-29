import stem from 'wink-porter2-stemmer';
import regex from './utils/regex.js';

export default class Keyword {

  word = '';
  stem = '';

  constructor(word) {

    this.word = word.replace(regex.noWords, '').trim();
    this.stem = stem(this.word);

  }

}
