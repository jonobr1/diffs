import React, { useEffect, useRef, useState } from 'react';
import Visualization from './visualization.js';
import { random } from './utils/colors.js';

import "./main.css";

export default function App(props) {

  var domElement = useRef();

  var [textIsVisible, setTextIsVisible] = useState(true);
  var [vizIsVisible, setVizIsVisible] = useState(true);
  var [texts, setTexts] = useState([{ id: 0, index: 0, color: random(0, 0.5) }]);

  function increase() {
    var result = texts.slice(0);
    result.push({ id: result.length, index: 0, color: random(0, 0.5) });
    setTexts(result);
    focus();
  }

  function reduce() {
    var result = texts.slice(0);
    result.pop();
    setTexts(result);
    focus();
  }

  function toggleText() {
    setTextIsVisible(!textIsVisible);
  }

  function toggleVisuals() {
    setVizIsVisible(!vizIsVisible);
  }

  function focus() {
    requestAnimationFrame(function() {
      var selector = 'div.text div.column:last-child textarea';
      var textarea = domElement.current.querySelector(selector);
      if (textarea) {
        textarea.focus();
      }
    });
  }

  function save() {
    var canvas = document.querySelector('canvas');
    var a = document.createElement('a');
    a.href = canvas.toDataURL('image/png');
    a.download = 'diffs.png';
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  //

  function render(text, i) {
    var ds = {
      width: `${(100 / texts.length).toFixed(3)}vw`
    };
    var ts = {
      color: text.color
    };
    return (
      <div key={ i } className="column" style={ ds }>
        <textarea style={ ts } />
      </div>
    );
  }

  return (
    <div ref={ domElement } className="app">

      <div className={ ['view', 'visualization', vizIsVisible ? 'enabled' : ''].join(' ') }>
        <Visualization objects={ texts } />
      </div>

      <div className={ ['view', 'text', textIsVisible ? 'enabled' : ''].join(' ') }>
        { texts.map(render) }
      </div>

      <div className="menu">
        <button onClick={ increase }>
          Add Text Field
        </button>
        <button onClick={ reduce }>
          Remove Text Field
        </button>
        <span>
          <input id="text-visibility" type="checkbox" defaultChecked={ textIsVisible } onChange={ toggleText } />
          <label htmlFor="text-visibility">Text Visible</label>
        </span>
        <span>
          <input id="viz-visibility" type="checkbox" defaultChecked={ vizIsVisible } onChange={ toggleVisuals } />
          <label htmlFor="viz-visibility">Visuals Visible</label>
        </span>
        <button onClick={ save }>
          Save Image
        </button>
      </div>

    </div>
  );

}
