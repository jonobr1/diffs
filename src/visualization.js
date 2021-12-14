import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import Group from './group.js';

var MAX_ITERATIONS = 100;

export default function Visualization(props) {

  var domElement = useRef();
  var refs = useRef({ objects: [] });

  useEffect(setup, []);
  useEffect(assign, [props.objects]);

  function setup() {

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

    function update() {

      var { objects } = refs.current;

      for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        coordinate(obj, objects.length);
        tick(obj);
      }

    }

    function coordinate(obj, total) {

      if (!obj.domElement) {
        var selector = `div.text div.column:nth-child(${obj.id + 1}) textarea`;
        obj.domElement = document.querySelector(selector);
      }
      if (!obj.destination) {
        obj.destination = new Two.Vector();
      }
      if (!obj.groups) {
        obj.groups = [];
        obj.groups.index = 0;
      }

      var value = obj.domElement.value;

      if (value !== obj.previousText) {
        obj.previousText = value;
        obj.index = 0;
        obj.registry = {};
      }

      var { index, domElement, groups, registry, color } = obj;
      var text = domElement.value.toLowerCase().split(/\s+/i).filter(isWord);
      var limit = Math.min(index + MAX_ITERATIONS, text.length);

      var rad = Math.min(two.width, two.height) * 0.33;
      var theta = ((obj.id + 0.5) / total) * Math.PI * 2;
      var x = rad * Math.cos(theta);
      var y = rad * Math.sin(theta);
      var toHide = [];

      obj.destination.set(x, y);

      for (var i = index; i < limit; i++) {

        var word = text[i].trim().replace(/\W/ig, '');
        var group = groups[i];

        if (word in registry) {
          registry[word]++;
          if (group) {
            toHide.push(group);
          }
          continue;
        }

        if (!group) {
          group = new Group(word, color, obj.destination);
          groups.push(group);
          two.add(group.object);
        }

        registry[word] = 1;

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

    function tick({ groups }) {

      for (var j = 0; j < Math.min(MAX_ITERATIONS, groups.length); j++) {

        var i = j % groups.length;
        var group = groups[i];

        if (!group.object.visible) {
          continue;
        }

        group.update();

        for (var k = i + 1; k < groups.length; k++) {
          if (groups[k].object.visible) {
            group.repel(groups[k].object.position);
          }
        }

      }

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
