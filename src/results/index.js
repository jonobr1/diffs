import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import ZUI from 'two.js/extras/jsm/zui.js';
import Legend from '../legend.js';
import Group from './group.js';
import Registry from '../registry.js';
import { random } from '../utils/colors.js';
import { styles as defaultStyles } from '../utils/styles.js';

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
      var i, object;

      if (!objects) {
        return;
      }

      if ((legend.props && legend.props.length) !== objects.length) {
        objects.registry = registry;
        legend.props = objects;
        legend.update();
      }

      if (requiresReset(objects)) {

        reset();

      } else {

        for (i = 0; i < objects.length; i++) {

          object = objects[i];
          layout(object, objects.length);

        }

        if (registry.needsUpdate) {
          reconcile();
        }

      }

      refs.current.needsUpdate = false;

    }

    function requiresReset(objects) {

      for (var i = 0; i < objects.length; i++) {

        var object = objects[i];
        var a = object.previousText === undefined;
        var b = !object.domElement;

        if (a || b || object.previousText !== object.domElement.innerText) {
          return true;
        }

      }

      return false

    }

    function layout(object, total) {

      var { index, domElement, groups, color, yid } = object;
      var text = domElement.innerText.toLowerCase().split(/\s+/i).filter(isWord);
      var limit = Math.min(index + MAX_ITERATIONS, text.length);

      if (!object.processing || object.processing && index >= text.length) {
        object.processing = false;
        while (groups.children.length > text.length) {
          groups.children[groups.children.length - 1].remove();
        }
        return;
      }

      for (var i = index; i < limit; i++) {

        var ref;
        var word = text[i].trim().replace(/\W/ig, '');
        var group = groups.children[i];

        if (!group) {
          group = new Group(word, 1, color);
        }

        if (!group.parent || group.parent.id !== groups.id) {
          groups.add(group);
        }

        group.color = color;
        group.position.y = yid * (defaultStyles.leading * 1.15);
        group.word = word;
        group.count = 1;
        group.visible = true;

        if (object.registry.contains(word)) {
          object.registry.increment(word);
          group.visible = false;
          ref = object.registry.get(word);
          ref.count = object.registry.stats[word];
        } else {
          object.registry.add(word, group);
          yid++;
        }

      }

      object.index = i;
      object.yid = yid;

    }

    function reconcile() {

      var { objects } = refs.current;
      var needsUpdate = false;
      var i, object;

      for (i = 0; i < objects.length; i++) {
        object = objects[i];
        if (object.processing) {
          needsUpdate = true;
        }
      }

      if (!needsUpdate) {
        for (i = 0; i < objects.length; i++) {
          object = objects[i];
          if (merge(object)) {
            needsUpdate = true;
          }
        }
      }

      registry.needsUpdate = needsUpdate;

    }

    function merge(object) {

      var needsUpdate = true;
      var { mergeId } = object;
      var size = object.registry.size;
      var limit = Math.min(mergeId + MAX_ITERATIONS, size);

      for (var i = mergeId; i < limit; i++) {

        var ref;
        var group = object.registry.list[i];
        var word = group.word;
        var count = object.registry.stats[word];

        if (registry.contains(word)) {
          group.visible = false;
          registry.increment(word, count);
          if (registry.invocations[word] === 2) {
            ref = registry.get(word);
            ref.count = registry.stats[word];
            ref.color = registry.color;
            ref.position.y = registry.yid * (defaultStyles.leading * 1.15);
            registry.group.add(ref);
            registry.yid++;
          }
        } else {
          registry.add(word, group);
        }

      }

      object.mergeId = i;

      if (i >= size - 1) {
        needsUpdate = false;
      }

      return needsUpdate;

    }

    function reset() {

      var { objects } = refs.current;

      for (var i = 0; i < objects.length; i++) {

        var object = objects[i];

        object.yid = 0;
        object.index = 0;
        object.mergeId = 0;
        object.processing = true;

        if (!object.domElement) {
          var selector = `div.text div.column:nth-child(${object.id + 1}) div.textarea`;
          object.domElement = document.querySelector(selector);
        }

        object.previousText = object.domElement.innerText;

        if (object.registry) {
          object.registry.clear();
        } else {
          object.registry = new Registry();
        }

        if (!object.groups) {
          object.groups = new Two.Group;
          object.groups.position.y = 100;
          object.groups.position.x = (i + 1) * 250;
          stage.add(object.groups);
        }

      }

      if (!registry.group) {
        registry.group = new Two.Group();
        registry.group.position.y = 100;
        registry.group.position.x = 40;
        stage.add(registry.group);
      } else {
        // TODO: Turn into animation loop
        while (registry.group.children.length > 0) {
          registry.group.children[registry.group.children.length - 1].remove();
        }
      }
      registry.yid = 0;
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
