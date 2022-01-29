import React, { useEffect, useRef, useState } from 'react';
import Results from './results/index.js';
import Keyword from './keyword.js';
import debounce from './utils/debounce.js';
import { random } from './utils/colors.js';

import "./main.css";

// var MAX_ITERATIONS = 50;

export default function App(props) {

  var domElement = useRef();

  var [textIsVisible, setTextIsVisible] = useState(true);
  var [vizIsVisible, setVizIsVisible] = useState(true);
  var [highlightIsVisible, setHighlightIsVisible] = useState(false);
  var [texts, setTexts] = useState([{
    id: 0,
    name: '',
    index: 0,
    color: random(0, 0.5),
    innerText: '',
    keywords: []
  }]);

  function increase() {
    var result = texts.slice(0);
    result.push({
      id: result.length,
      name: '',
      index: 0,
      color: random(0, 0.5),
      innerText: '',
      keywords: []
    });
    setTexts(result);
    focus();
  }

  function decrease() {
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

  function toggleHighlights() {
    setHighlightIsVisible(!highlightIsVisible);
  }

  function focus() {
    requestAnimationFrame(function() {
      var selector = 'div.text div.column:last-child div.textarea';
      var textarea = domElement.current.querySelector(selector);
      if (textarea) {
        textarea.focus();
      }
    });
  }

  function save() {
    var canvas = document.querySelector('svg');
    var serializer = new XMLSerializer();
    var source = serializer.serializeToString(canvas);
    var a = document.createElement('a');
    a.href = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(source)}`;
    a.download = 'diffs.svg';
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

    return (
      <div key={ i } className="column" style={ ds }>
        <input type="text" name="title" defaultValue={ `Text ${i + 1}` } onChange={ update } />
        <div
          id={ `ta-${i}` }
          tab={ i }
          className="textarea"
          contentEditable={ !highlightIsVisible }
          onClick={ click }
          onKeyUp={ debounce(keyup, 500) }
          onPaste={ paste } />
      </div>
    );

    function click(e) {
      if (!highlightIsVisible) {
        return;
      }
      var selection = window.getSelection();
      if (typeof selection.anchorOffset === 'number' && selection.anchorOffset === selection.focusOffset) {
        highlightAt(selection.anchorNode);
      }
    }

    function keyup(e) {
      var text = e.target.innerText;
      setTexts(function(texts) {
        var result = [ ...texts ];
        var obj = result[i];
        if (obj.innerText !== text) {
          obj.innerText = text;
          obj.keywords = text.toLowerCase()
            .split(/\s+/i)
            .filter(isWord)
            .map(createKeyword);
        }
        return result;
      });
    }

    function paste(e) {
      e.preventDefault();
      var text = e.clipboardData.getData('text/plain');
      document.execCommand('insertHTML', false, text);
    }

    function highlightAt(elem) {

      var selection = window.getSelection();
      var text = elem.textContent;
      var pos = selection.anchorOffset;

      if (/[\s]/i.test(text[pos])) {
        if (pos > 0 && /\w/i.test(text[pos - 1])) {
          pos--;
        } else if (pos < text.length && /\w/i.test(text[pos + 1])) {
          pos++;
        }
      }

      var start = pos;
      var end = pos;
      var startFound = false;
      var endFound = false;

      while (!startFound || !endFound) {
        if (!startFound) {
          if (start <= 0 || /[\s]/i.test(text[start])) {
            startFound = true;
          } else {
            start = Math.max(0, start - 1);
          }
        }
        if (!endFound) {
          if (end >= text.length || /[\s]/i.test(text[end])) {
            endFound = true;
          } else {
            end = Math.min(text.length, end + 1);
          }
        }
      }

      var word = text.slice(start, end);

      if (word) {
        var keyword = new Keyword(word);
        highlight(keyword);
      }

    }

    function highlight({ word, stem }) {

      var elems = document.body.querySelectorAll('div.textarea');
      var index = 0;
      var regex = new RegExp(`(^|\\W)(${word})(\\W|$)`, 'ig');
      var response = `$1<span class="highlight">${word}</span>$3`;

      tick();

      function tick() {

        var elem = elems[index];

        if (elem) {
          index++;
          elem.innerHTML = elem.innerText.replace(regex, response);
          requestAnimationFrame(tick);
        }

      }

    }

    function update(e) {
      var value = e.target.value;
      setTexts(function(texts) {
        var result = [ ...texts ];
        result[i].name = value;
        return result;
      });
    }

  }

  return (
    <div ref={ domElement } className="app">

      <div className={ ['view', 'visualization', vizIsVisible ? 'enabled' : ''].join(' ') }>
        <Results objects={ texts } />
      </div>

      <div className={ ['view', 'text', textIsVisible ? 'enabled' : '', highlightIsVisible ? 'highlighting' : ''].join(' ') }>
        { texts.map(render) }
      </div>

      <div className="menu">
        <button onClick={ increase }>
          Add Text Field
        </button>
        <button onClick={ decrease }>
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
        <span>
          <input id="highlight-visibility" type="checkbox" defaultChecked={ highlightIsVisible } onChange={ toggleHighlights } />
          <label htmlFor="highlight-visibility">Highlight Mode</label>
        </span>
        <button onClick={ save }>
          Save Image
        </button>
      </div>

    </div>
  );

}

function isWord(str) {
  return typeof str === 'string' && /\w/.test(str);
}

function createKeyword(word, i) {
  return new Keyword(word);
}
