import Two from 'two.js';

export default class {

  needsUpdate = false;

  list = [];
  map = {};
  stats = {};
  invocations = {};
  destination = new Two.Vector();

  constructor() {}

  get(id) {
    return this.map[id] || null;
  }

  add(id, object) {
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

  remove(id) {
    var object = this.map[id];
    // TODO: Remove object from list
    delete this.map[id];
    delete this.stats[id];
    delete this.invocations[id];
    return object;
  }

  increment(id, amt) {
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

  contains(id) {
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
