import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import Matter from 'matter-js';
import Group from './group.js';
import Registry from './registry.js';

var MAX_ITERATIONS = 100;

export default function Visualization(props) {

  var domElement = useRef();
  var refs = useRef({ objects: [] });

  useEffect(setup, []);
  useEffect(assign, [props.objects]);

  function setup() {

    var registry = new Registry();
    var engine = Matter.Engine.create();

    engine.gravity.x = 0;
    engine.gravity.y = 0;

    var two = new Two({
      type: Two.Types.canvas,
      fullscreen: true,
      autostart: true
    }).appendTo(domElement.current);

    two.bind('update', update)
       .bind('resize', resize);

    resize();

    return unmount;

    function unmount() {
      two.scene.remove();
      two.release(two.scene);
      domElement.current.removeChild(two.renderer.domElement);
    }

    function resize() {
      two.scene.position.set(two.width / 2, two.height / 2);
    }

    function update(frameCount, timeDelta) {

      Matter.Engine.update(engine, timeDelta);

      var { objects } = refs.current;

      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        coordinate(obj, objects.length);
        tick(obj);
      }

      if (registry.needsUpdate) {
        reconcile();
      }

    }

    function coordinate(obj, total) {

      if (!obj.domElement) {
        var selector = `div.text div.column:nth-child(${obj.id + 1}) textarea`;
        obj.domElement = document.querySelector(selector);
      }
      if (!obj.groups) {
        obj.groups = [];
        obj.groups.index = 0;
      }

      var value = obj.domElement.value;

      if (value !== obj.previousText) {

        obj.previousText = value;

        obj.index = 0;
        obj.tickId = 0;
        obj.mergeId = 0;

        if (obj.registry) {
          obj.registry.clear();
        } else {
          obj.registry = new Registry();
        }

        registry.needsUpdate = true;
        registry.clear();

      }

      var { index, domElement, groups, color } = obj;
      var text = domElement.value.toLowerCase().split(/\s+/i).filter(isWord);
      var limit = Math.min(index + MAX_ITERATIONS, text.length);

      var rad = Math.min(two.width, two.height) * 0.33;
      var theta = ((obj.id + 0.5) / total) * Math.PI * 2;
      var x = rad * Math.cos(theta);
      var y = rad * Math.sin(theta);
      var toHide = [];

      obj.registry.destination.set(x, y);

      for (var i = index; i < limit; i++) {

        var word = text[i].trim().replace(/\W/ig, '');
        var group = groups[i];

        if (obj.registry.contains(word)) {
          obj.registry.increment(word);
          if (group) {
            toHide.push(group);
          }
          // TODO: Update the linked group's scale
          continue;
        }

        if (!group) {
          group = new Group(engine, word, color, obj.registry.destination);
          groups.push(group);
          two.add(group.object);
        }

        obj.registry.add(word, group);

        group.destination = obj.registry.destination;
        group.word = word;
        group.object.visible = true;

      }

      obj.index = i;

      hide(toHide);

      if (obj.index >= text.length) {
        if (groups.length > text.length) {
          remove(groups.splice(text.length, groups.length - text.length));
        }
      }

    }

    function tick(obj) {

      var { tickId, groups } = obj;

      for (var j = tickId; j < Math.min(tickId + MAX_ITERATIONS, groups.length); j++) {

        var group = groups[j];

        if (!group.object.visible) {
          continue;
        }

        group.update();

      }

      if (j >= groups.length - 1) {
        obj.tickId = 0;
      } else {
        obj.tickId = i;
      }

    }

    function reconcile() {

      var { objects } = refs.current;
      var needsUpdate = false;

      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        if (merge(obj)) {
          needsUpdate = true;
        }
      }

      registry.needsUpdate = needsUpdate;

    }

    function merge(obj) {

      var needsUpdate = true;
      var { mergeId } = obj;
      var size = obj.registry.size;
      var toHide = [];

      for (var i = mergeId; i < Math.min(mergeId + MAX_ITERATIONS, size); i++) {

        var ref;
        var group = obj.registry.list[i];
        var word = group.word;
        var count = obj.registry.stats[word];

        if (registry.contains(word)) {
          toHide.push(group);
          registry.increment(word, count);
          if (registry.invocations[word] === 2) {
            // TODO: Set scale here
            ref = registry.get(word);
            ref.destination = registry.destination;
          }
        } else {
          registry.add(word, group);
        }

      }

      if (i >= size - 1) {
        obj.mergeId = 0;
        needsUpdate = false;
      } else {
        obj.mergeId = i;
      }

      hide(toHide);

      return needsUpdate;

    }

    function remove(groups) {
      for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        group.dispose();
      }
    }

    function hide(groups) {
      for (var i = 0; i < groups.length; i++) {
        var group = groups[i];
        group.object.visible = false;
      }
    }

  }

  function assign() {
    refs.current.objects = props.objects;
  }

  return <div ref={ domElement } />;

}

function isWord(str) {
  return !!str;
}
