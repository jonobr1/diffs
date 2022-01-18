import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import ZUI from 'two.js/extras/jsm/zui.js';
import Legend from '../legend.js';
import Group from './group.js';
import Registry from '../registry.js';
import { random } from '../utils/colors.js';
import {styles as defaultStyles } from '../utils/styles.js';

var MAX_ITERATIONS = 50;

export default function Results(props) {

  var refs = useRef();
  var domElement = useRef();

  useEffect(setup, []);
  useEffect(assign, [props.objects]);

  function setup() {

    var two = new Two({
      fullscreen: true,
      autostart: true
    }).appendTo(domElement.current);

    var stage = two.makeGroup();
    var legend = new Legend();

    two.add(legend.group);

    var registry = new Registry();
    registry.color = random(0, 0.5);

    addZUI();

    two.bind('update', update)
       .bind('resize', resize);

    resize();

    refs.current = {
      two,
      legend,
      registry,
      stage
    };

    return unmount;

    function unmount() {

      two.scene.remove();
      two.release(two.scene);

      domElement.current.removeChild(two.renderer.domElement);

      two.renderer.domElement.removeEventListener('mousedown', mousedown, false);
      two.renderer.domElement.removeEventListener('mousewheel', mousewheel, false);
      two.renderer.domElement.removeEventListener('wheel', mousewheel, false);

      two.renderer.domElement.removeEventListener('touchstart', touchstart, false);
      two.renderer.domElement.removeEventListener('touchmove', touchmove, false);
      two.renderer.domElement.removeEventListener('touchend', touchend, false);
      two.renderer.domElement.removeEventListener('touchcancel', touchend, false);

    }

    function resize() {
      registry.destination.set(two.width / 2, two.height / 2);
      legend.group.position.set(0, two.height);
    }

    function addZUI() {

      var domElement = two.renderer.domElement;
      var zui = new ZUI(stage);
      var mouse = new Two.Vector();
      var touches = {};
      var distance = 0;

      zui.addLimits(0.06, 8);

      domElement.addEventListener('mousedown', mousedown, false);
      domElement.addEventListener('mousewheel', mousewheel, false);
      domElement.addEventListener('wheel', mousewheel, false);

      domElement.addEventListener('touchstart', touchstart, false);
      domElement.addEventListener('touchmove', touchmove, false);
      domElement.addEventListener('touchend', touchend, false);
      domElement.addEventListener('touchcancel', touchend, false);

      function mousedown(e) {
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        window.addEventListener('mousemove', mousemove, false);
        window.addEventListener('mouseup', mouseup, false);
      }

      function mousemove(e) {
        var dx = e.clientX - mouse.x;
        var dy = e.clientY - mouse.y;
        zui.translateSurface(dx, dy);
        mouse.set(e.clientX, e.clientY);
      }

      function mouseup(e) {
        window.removeEventListener('mousemove', mousemove, false);
        window.removeEventListener('mouseup', mouseup, false);
      }

      function mousewheel(e) {
        var dy = (e.wheelDeltaY || - e.deltaY) / 1000;
        zui.zoomBy(dy, e.clientX, e.clientY);
      }

      function touchstart(e) {
        switch (e.touches.length) {
          case 2:
            pinchstart(e);
            break;
          case 1:
            panstart(e)
            break;
        }
      }

      function touchmove(e) {
        switch (e.touches.length) {
          case 2:
            pinchmove(e);
            break;
          case 1:
            panmove(e)
            break;
        }
      }

      function touchend(e) {
        touches = {};
        var touch = e.touches[ 0 ];
        if (touch) {  // Pass through for panning after pinching
          mouse.x = touch.clientX;
          mouse.y = touch.clientY;
        }
      }

      function panstart(e) {
        var touch = e.touches[ 0 ];
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
      }

      function panmove(e) {
        var touch = e.touches[ 0 ];
        var dx = touch.clientX - mouse.x;
        var dy = touch.clientY - mouse.y;
        zui.translateSurface(dx, dy);
        mouse.set(touch.clientX, touch.clientY);
      }

      function pinchstart(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[ i ];
          touches[ touch.identifier ] = touch;
        }
        var a = touches[ 0 ];
        var b = touches[ 1 ];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        distance = Math.sqrt(dx * dx + dy * dy);
        mouse.x = dx / 2 + a.clientX;
        mouse.y = dy / 2 + a.clientY;
      }

      function pinchmove(e) {
        for (var i = 0; i < e.touches.length; i++) {
          var touch = e.touches[ i ];
          touches[ touch.identifier ] = touch;
        }
        var a = touches[ 0 ];
        var b = touches[ 1 ];
        var dx = b.clientX - a.clientX;
        var dy = b.clientY - a.clientY;
        var d = Math.sqrt(dx * dx + dy * dy);
        var delta = d - distance;
        zui.zoomBy(delta / 250, mouse.x, mouse.y);
        distance = d;
      }

    }

    function update() {

      var { objects } = refs.current;
      var i, obj;

      if (!objects) {
        return;
      }

      if ((legend.props && legend.props.length) !== objects.length) {
        objects.registry = registry;
        legend.props = objects;
        legend.update();
      }

      if (requiresUpdate(objects)) {
        reset();
      }

      for (i = 0; i < objects.length; i++) {

        obj = objects[i];
        layout(obj, objects.length);

      }

      if (registry.needsUpdate) {
        reconcile();
      }

      refs.current.needsUpdate = false;

    }

    function requiresUpdate(objects) {

      for (var i = 0; i < objects.length; i++) {

        var obj = objects[i];
        var a = obj.previousText === undefined;
        var b = !obj.domElement;

        if (a || b || obj.previousText !== obj.domElement.value) {
          return true;
        }

      }

      return false

    }

    function layout(obj, total) {

      var { index, domElement, groups, color } = obj;
      var text = domElement.value.toLowerCase().split(/\s+/i).filter(isWord);
      var limit = Math.min(index + MAX_ITERATIONS, text.length);
      var yid = index;

      for (var i = index; i < limit; i++) {

        var ref;
        var word = text[i].trim().replace(/\W/ig, '');
        var group = groups.children[i];

        if (!group) {
          group = new Group(word, 1, color);
          groups.add(group.object);
        } else {
          group = group.reference;
        }

        if (obj.registry.contains(word)) {
          obj.registry.increment(word);
          group.object.visible = false;
          ref = obj.registry.get(word);
          ref.count++;
          continue;
        }

        yid++;

        obj.registry.add(word, group);

        ref = registry.get(word);

        if (group.object.parent !== groups) {
          obj.groups.add(group.object);
        }

        group.color = color;
        group.object.position.y = yid * (defaultStyles.leading * 1.15);
        group.word = word;
        group.count = 1;
        group.object.visible = true;

      }

      obj.index = i;

    }

    function reconcile() {

      var { objects } = refs.current;
      var needsUpdate = false;
      var obj;

      for (var i = 0; i < objects.length; i++) {
        obj = objects[i];
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

      for (var i = mergeId; i < Math.min(mergeId + MAX_ITERATIONS, size); i++) {

        var ref;
        var group = obj.registry.list[i];
        var word = group.word;
        var count = obj.registry.stats[word];

        if (registry.contains(word)) {
          group.object.visible = false;
          registry.increment(word, count);
          if (registry.invocations[word] === 2) {
            ref = registry.get(word);
            ref.count = registry.stats[word];
            ref.color = registry.color;
            ref.object.position.x = 40;
            registry.group.add(ref.object);
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

      return needsUpdate;

    }

    function reset() {

      var { objects } = refs.current;

      for (var i = 0; i < objects.length; i++) {

        var obj = objects[i];

        obj.index = 0;
        obj.mergeId = 0;

        if (!obj.domElement) {
          var selector = `div.text div.column:nth-child(${obj.id + 1}) textarea`;
          obj.domElement = document.querySelector(selector);
        }

        obj.previousText = obj.domElement.value;

        if (obj.registry) {
          obj.registry.clear();
        } else {
          obj.registry = new Registry();
        }

        if (!obj.groups) {
          obj.groups = new Two.Group;
          obj.groups.position.y = 75;
          obj.groups.position.x = (i + 1) * 250;
          stage.add(obj.groups);
        }

      }

      if (!registry.group) {
        registry.group = new Two.Group();
        registry.group.position.y = 75;
        registry.group.position.x = 40;
        stage.add(registry.group);
      }
      registry.needsUpdate = true;
      registry.clear();

    }

  }

  function assign() {
    refs.current.objects = props.objects;

    if (refs.current.legend) {
      refs.current.legend.update();
    }

  }

  return <div ref={ domElement } />;

}

function isWord(str) {
  return !!str;
}
