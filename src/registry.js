import Two from 'two.js';
import stem from 'wink-porter2-stemmer';

export default class {

  needsUpdate = false;

  list = [];
  map = {};
  stats = {};
  invocations = {};
  destination = new Two.Vector();

  constructor() {}

  get(key) {
    var prop;
    var id = stem(key);

    if (arguments.length > 1) {
      prop = arguments[1]
    }
    if (typeof prop !== 'string' && !(prop in this)) {
      prop = 'map';
    }

    return this[prop][id] || null;

  }

  add(key, object) {
    var id = stem(key);
    this.map[id] = object;
    if (typeof this.stats[id] === 'undefined') {
      this.list.push(object);
      this.stats[id] = object.count || 1;
      this.invocations[id] = 1;
    } else {
      this.stats[id] += object.count || 1;
      this.invocations[id]++;
    }
  }

  remove(key) {
    var id = stem(key);
    var object = this.map[id];
    // TODO: Remove object from list
    delete this.map[id];
    delete this.stats[id];
    delete this.invocations[id];
    return object;
  }

  increment(key, amt) {
    var id = stem(key);
    if (typeof this.stats[id] !== 'number') {
      console.warn(`Registry.increment: stats['${id}'] is not a number.`);
    } else if (typeof amt === 'number') {
      this.stats[id] += amt;
      this.invocations[id]++;
    } else {
      this.stats[id]++;
      this.invocations[id]++;
    }
  }

  contains(key) {
    var id = stem(key);
    return id in this.map;
  }

  clear() {
    this.index = 0;
    this.list = [];
    this.map = {};
    this.stats = {};
    this.invocations = {};
  }

  get size() {
    return this.list.length;
  }

}
