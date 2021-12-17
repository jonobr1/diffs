import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import ZUI from 'two.js/extras/jsm/zui.js';
import Matter from 'matter-js';
import Legend from './legend.js';
import Group from './group.js';
import Registry from './registry.js';
import { random } from './utils/colors.js';

var MAX_ITERATIONS = 50;

export default function Visualization(props) {

  var domElement = useRef();
  var refs = useRef({ objects: [] });

  useEffect(setup, []);
  useEffect(assign, [props.objects]);

  function setup() {

    var engine = Matter.Engine.create();

    engine.gravity.x = 0;
    engine.gravity.y = 0;

    var two = new Two({
      type: Two.Types.canvas,
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

    function update(frameCount, timeDelta) {

      Matter.Engine.update(engine, timeDelta);

      var { objects } = refs.current;
      var needsUpdate = false;
      var i, obj;

      if ((legend.props && legend.props.length) !== objects.length) {
        objects.registry = registry;
        legend.props = objects;
        legend.update();
      }

      for (i = 0; i < objects.length; i++) {
        obj = objects[i];
        if (requiresUpdate(obj)) {
          needsUpdate = true;
        }
      }

      for (i = 0; i < objects.length; i++) {
        obj = objects[i];
        if (needsUpdate) {
          obj.needsUpdate = true;
        }
        coordinate(obj, objects.length);
        tick(obj);
      }

      if (registry.needsUpdate) {
        reconcile();
      }

    }

    function requiresUpdate(obj) {

      if (!obj.domElement) {
        var selector = `div.text div.column:nth-child(${obj.id + 1}) textarea`;
        obj.domElement = document.querySelector(selector);
      }
      if (!obj.groups) {
        obj.groups = [];
        obj.groups.index = 0;
      }

      return obj.domElement.value !== obj.previousText;

    }

    function coordinate(obj, total) {

      var needsUpdate = false;

      if (obj.needsUpdate) {

        obj.previousText = obj.domElement.value;

        obj.index = 0;
        obj.tickId = 0;
        obj.mergeId = 0;

        if (obj.registry) {
          obj.registry.clear();
        } else {
          obj.registry = new Registry();
        }

        needsUpdate = true;
        registry.needsUpdate = true;
        registry.clear();
        obj.needsUpdate = false;

      }

      var { index, domElement, groups, color } = obj;
      var text = domElement.value.toLowerCase().split(/\s+/i).filter(isWord);
      var limit = Math.min(index + MAX_ITERATIONS, text.length);

      var rad = Math.min(two.width, two.height) * 0.33;
      var theta = ((obj.id + 0.5) / total) * Math.PI * 2;
      var x = rad * Math.cos(theta) + two.width / 2;
      var y = rad * Math.sin(theta) + two.height / 2;
      var toHide = [];

      obj.registry.destination.set(x, y);

      for (var i = index; i < limit; i++) {

        var ref;
        var word = text[i].trim().replace(/\W/ig, '');
        var group = groups[i];

        if (obj.registry.contains(word)) {
          obj.registry.increment(word);
          if (group) {
            toHide.push(group);
          }
          ref = obj.registry.get(word);
          ref.scale = 5 * (word.length + 2) * obj.registry.stats[word];
          continue;
        }

        if (!group) {
          group = new Group(engine, word, color, obj.registry.destination);
          groups.push(group);
          stage.add(group.object);
        }

        obj.registry.add(word, group);

        ref = registry.get(word);

        if (!ref || ref.id !== group.id) {
          group.life = 1;
          group.color = color;
          group.scale = 5 * (word.length + 2);
          group.destination = obj.registry.destination;
        }

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

      return needsUpdate;

    }

    function tick(obj) {

      var { tickId, groups } = obj;

      for (var i = tickId; i < Math.min(tickId + MAX_ITERATIONS, groups.length); i++) {

        var group = groups[i];

        if (!group.object.visible) {
          continue;
        }

        group.update();

      }

      if (i >= groups.length) {
        obj.tickId = 0;
      } else {
        obj.tickId = i;
      }

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
            ref = registry.get(word);
            ref.destination = registry.destination;
            ref.scale = 5 * (word.length + 2) * registry.stats[word];
            ref.color = registry.color;
            ref.life = 1;
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
