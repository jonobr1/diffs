import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import TWEEN from '@tweenjs/tween.js';
import { ZUI } from 'two.js/extras/jsm/zui.js';
import Legend from '../legend.js';
import GraphLine from './graph-line.js';
import StatLine from './stat-line.js';
import Registry from '../registry.js';
import { Arc } from './arc.js';
import { random } from '../utils/colors.js';
import { styles as defaultStyles } from '../utils/styles.js';
import regex from '../utils/regex.js';

var MAX_ITERATIONS = 1;

export default function Results(props) {

  var refs = useRef({});
  var domElement = useRef();

  useEffect(setup, []);
  useEffect(assign, [props.objects]);
  useEffect(highlight, [props.keyword]);
  useEffect(toggle, [props.isHighlighted]);

  function setup() {

    var two = new Two({
      fullscreen: true,
      autostart: true
    }).appendTo(domElement.current);

    var grid = new Two.Group();
    var body = new Two.Group();
    var arcs = new Two.Group();
    var stage = two.makeGroup(arcs, grid, body);
    var legend = new Legend();

    two.add(legend.group);

    var registry = new Registry();
    registry.color = random(0, 0.5);

    var zui = new ZUI(stage);

    addZUI();

    two.bind('update', update)
       .bind('resize', resize);

    resize();

    refs.current.two = two;
    refs.current.legend = legend;
    refs.current.registry = registry;
    refs.current.stage = stage;
    refs.current.body = body;
    refs.current.arcs = arcs;
    refs.current.zui = zui;
    refs.current.click = function(e) {
      var elem = e.target;
      var parent = elem.parentNode;
      var stem = parent.getAttribute('class')
        .replace(/(sl|highlight)/ig, '').trim();
      if (props.onSelect) {
        props.onSelect(stem);
      }
    };
    refs.current.needsUpdate = false;

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

      TWEEN.update();

      var { objects, needsUpdate } = refs.current;
      var i, object;

      if (!objects) {
        return;
      }

      if ((legend.props && legend.props.length) !== objects.length) {
        objects.registry = registry;
        legend.props = objects;
        legend.update();
      }

      if (needsUpdate) {

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

    function layout(object, total) {

      var { index, keywords, group, grid, color, yid } = object;
      var limit = Math.min(index + MAX_ITERATIONS, keywords.length);

      if (!object.processing || object.processing && index >= keywords.length) {
        object.processing = false;
        while (group.children.length > keywords.length) {
          group.children[group.children.length - 1].remove();
        }
        return;
      }

      for (var i = index; i < limit; i++) {

        var ref;
        var keyword = keywords[i];
        var { word, stem } = keyword;
        var child = group.children[i];

        if (!child) {
          child = new StatLine(keyword, 1, color);
        }

        if (!child.parent || child.parent.id !== group.id) {
          group.add(child);
        }

        child.isHighlighted = keyword.stem === refs.current.keyword.stem;
        child.color = color;
        child.position.y = yid++ * (defaultStyles.leading * 1.15);
        child.keyword = keyword;
        child.count = 1;
        child.visible = !regex.restricted.test(word.replace(/[\'\???].*/i, ''));

        grid.addPoint(child.position.clone());

        if (object.registry.contains(stem)) {
          object.registry.increment(stem);
          child.visible = false;
          ref = object.registry.get(stem);
          ref.count = object.registry.get(stem, 'stats');
        } else {
          object.registry.add(stem, child);
        }

      }

      object.index = i;
      object.yid = yid;

      if (child) {
        grid.bottom = child.position.y;
      }

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

      if (!registry.needsUpdate && props.onProcessingChange) {
        props.onProcessingChange(false);
      }

    }

    function merge(object) {

      var needsUpdate = true;
      var { mergeId } = object;
      var size = object.registry.size;
      var limit = Math.min(mergeId + MAX_ITERATIONS, size);

      for (var i = mergeId; i < limit; i++) {

        var ref;
        var group = object.registry.list[i];
        var { word, stem } = group.keyword;
        var count = object.registry.get(stem, 'stats');

        if (registry.contains(stem)) {
          group.visible = false;
          registry.increment(stem, count);
          ref = registry.get(stem);
          ref.count = registry.get(stem, 'stats');
          if (registry.get(stem, 'invocations') === 2) {
            ref.original.visible = false;
            ref.visible = !regex.restricted.test(word.replace(/[\'\???].*/i, ''));
            if (ref.visible) {
              ref.color = registry.color;
              ref.position.y = registry.yid * (defaultStyles.leading * 1.15);
              registry.group.add(ref);
              registry.yid++;
            }
          }
        } else {
          ref = new StatLine(group.keyword, count, registry.color);
          ref.original = group;
          registry.add(stem, ref);
        }

      }

      object.mergeId = i;

      if (i >= size - 1) {
        needsUpdate = false;
      }

      return needsUpdate;

    }

    function reset() {

      var length = 0;
      var { objects } = refs.current;

      for (var i = 0; i < objects.length; i++) {

        var object = objects[i];

        object.yid = 0;
        object.index = 0;
        object.mergeId = 0;
        object.processing = true;

        length += object.innerText.length;

        if (object.registry) {
          object.registry.clear();
        } else {
          object.registry = new Registry();
        }

        if (!object.group) {
          object.group = new Two.Group();
          object.group.position.y = 100;
          object.group.position.x = (i + 1) * 250;
          body.add(object.group);
        }

        if (!object.grid) {
          object.grid = new GraphLine();
          object.grid.position.y = 100;
          object.grid.position.x = (i + 1) * 250;
          grid.add(object.grid);
        } else {
          object.grid.reset();
        }

      }

      MAX_ITERATIONS = Math.min(Math.max(Math.floor(length / 100), 1), 250);

      if (!registry.group) {
        registry.group = new Two.Group();
        registry.group.position.y = 100;
        registry.group.position.x = 40;
        body.add(registry.group);
      } else {
        registry.group.remove(registry.group.children);
      }

      registry.yid = 0;
      registry.needsUpdate = true;
      registry.clear();

    }

    refs.current.needsUpdate = false;

  }

  function assign() {

    refs.current.objects = props.objects;
    refs.current.needsUpdate = true;

    if (props.onProcessingChange) {
      props.onProcessingChange(true);
    }

    if (refs.current.legend) {
      refs.current.legend.update();
    }

  }

  function highlight() {

    var children, child, current;
    var { two, stage, zui } = refs.current;
    var endpoints = [];

    refs.current.keyword = props.keyword;

    children = stage.getByClassName('highlight');

    for (var i = 0; i < children.length; i++) {
      child = children[i];
      child.isHighlighted = false;
    }

    if (props.keyword) {

      children = stage.getByClassName(props.keyword);

      for (var j = 0; j < children.length; j++) {

        child = children[j];

        if (child.visible) {
          // TODO: Arc starts here
          child.isHighlighted = true;
          current = child;
        } else {
          // End arc here
          endpoints.push(child);
        }

      }

      if (current) {

        var am = zui.surfaceMatrix;
        var bm = current.parent.matrix
          .multiply(current.position.x, current.position.y, 1);

        var v = new Two.Vector().set(
          am.elements[2],
          am.elements[5]
        );
        var dest = {
          x: two.width * 0.5 - bm.x * am.elements[0],
          y: two.height * 0.5 - bm.y * am.elements[0]
        };

        var tween = new TWEEN.Tween(v)
          .to(dest, 350)
          .easing(TWEEN.Easing.Sinusoidal.Out)
          .onUpdate(function() {

            am.elements[2] = v.x;
            am.elements[5] = v.y;
            zui.updateSurface();

          })
          .start();

      }

    }

    addArcs(current, endpoints);
    addHighlightsToGraphLines(props.keyword);

  }

  function addArcs(current, endpoints) {

    var matrix, wp, cp;
    var { arcs } = refs.current;

    if (arcs.children.length > 0) {
      arcs.remove(arcs.children);
    }

    if (current && endpoints.length > 0) {

      matrix = current.parent.matrix;
      wp = matrix.multiply(current.position.x, current.position.y, 1);

      for (var i = 0; i < endpoints.length; i++) {

        var child = endpoints[i];

        matrix = child.parent.matrix;
        cp = matrix.multiply(child.position.x, child.position.y, 1);

        var mx = (cp.x + wp.x) / 2;
        var my = (cp.y + wp.y) / 2;

        var dx = cp.x - wp.x;
        var dy = cp.y - wp.y;

        var r = Math.sqrt(dx * dx + dy * dy) / 2;
        var arc = new Arc(mx, my, r, 0, - Math.PI);

        arc.rotation = Math.atan2(dy, dx);
        arc.fill = 'none';
        arc.stroke = '#333';
        arcs.add(arc);

        arc.beginning = 1;

        var tween = new TWEEN.Tween(arc)
          .to({ beginning: 0 }, 350)
          .delay(i * 250)
          .easing(TWEEN.Easing.Sinusoidal.Out)
          .start();

      }

    }

  }

  function addHighlightsToGraphLines(keyword) {

    var { objects } = refs.current;
    var index = 0;

    tick();

    function tick() {

      if (!objects[index]) {
        return;
      }

      var object = objects[index];
      var { group, grid } = object;

      if (grid) {

        grid.clearHighlights();

        if (keyword) {
          for (var i = 0; i < group.children.length; i++) {
            var child = group.children[i];
            var stem = child.className.replace(/(sl|highlight)/ig, '').trim();
            if (stem === keyword) {
              grid.addHighlight(child.position.clone());
            }
          }
        }

      }

      index++;
      requestAnimationFrame(tick);

    }

  }

  function toggle() {

    var elems = document.querySelectorAll('svg g.sl');

    for (var i = 0; i < elems.length; i++) {
      var elem = elems[i];
      if (props.isHighlighted) {
        elem.addEventListener('click', refs.current.click, false);
      } else {
        elem.removeEventListener('click', refs.current.click, false);
      }
    }

  }

  return <div ref={ domElement } />;

}

function isWord(str) {
  return typeof str === 'string' && /\w/.test(str);
}
