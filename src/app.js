import React, { useEffect, useRef, useState } from 'react';
import Results from './results/index.js';
import Keyword from './keyword.js';
import debounce from './utils/debounce.js';
import { random } from './utils/colors.js';

import "./main.css";

var modes = ['chronologic', 'frequency', 'alphabetic'];
var sorting = [
  function(a, b) {
    return a.index - b.index;
  },
  function(a, b) {
    return b.frequency - a.frequency;
  },
  function(a, b) {
    var na = a.stem.toLowerCase();
    var nb = b.stem.toLowerCase();
    if (na < nb) {
      return - 1;
    }
    if (na > nb) {
      return 1;
    }
    return 0;
  }
];

var emptyState = [
  {
    id: 0,
    name: 'Text 1',
    color: random(0, 0.5),
    innerText: '',
    keywords: []
  }
];

export default function App(props) {

  var refs = useRef({});
  var domElement = useRef();

  var [textIsVisible, setTextIsVisible] = useState(true);
  var [vizIsVisible, setVizIsVisible] = useState(true);
  var [highlightIsVisible, setHighlightIsVisible] = useState(false);
  var [keyword, setKeyword] = useState('');
  var [mode, setMode] = useState(0);
  var [processing, setProcessing] = useState(false);
  var [texts, setTexts] = useState(emptyState);

  useEffect(setup, []);
  useEffect(debounce(store, 1000), [texts])

  function setup() {
    var state = localStorage.getItem('state');
    if (state) {
      state = JSON.parse(state).map(function(text) {
        requestAnimationFrame(function() {
          var selector;
          selector = `#ta-${text.id}`;
          document.querySelector(selector).innerText = text.innerText;
          selector = `#ti-${text.id}`;
          document.querySelector(selector).value = text.name;
        });
        text.keywords = text.innerText.toLowerCase()
          .split(/\s+/i)
          .filter(isWord)
          .map(createKeyword)
          .sort(sorting[mode]);
        return text;
      });
      setTexts(state);
    }
    refs.current.mounted = true;
  }

  function store() {
    if (refs.current && refs.current.mounted) {
      var state = texts.map(function(text) {
        return {
          id: text.id,
          name: text.name,
          color: text.color,
          innerText: text.innerText
        };
      });
      localStorage.setItem('state', JSON.stringify(state));
    }
  }

  function clear() {
    if (confirm('This will delete your current session. Are you sure you want to continue?')) {
      localStorage.clear();
      document.querySelectorAll('input.title').forEach(function(elem) {
        elem.value = emptyState[0].name;
      });
      document.querySelectorAll('div.textarea').forEach(function(elem) {
        elem.innerText = emptyState[0].innerText;
      });
      setTexts(emptyState);
    }
  }

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

  function cycle() {
    var result = texts.slice(0);
    setMode(function(mode) {
      mode = (mode + 1) % modes.length;
      for (var i = 0; i < result.length; i++) {
        var object = result[i];
        var iterator = sorting[mode];
        object.keywords = object.keywords.sort(iterator);
      }
      setTexts(result);
      setHighlightIsVisible(false);
      document.querySelector('#highlight-visibility').checked = false;
      return mode;
    });
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
        <input id={ `ti-${i}` } type="text" className="title" defaultValue={ `Text ${i + 1}` } onChange={ update } />
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
          if (obj.keywords) {
            Keyword.dispose(obj.keywords);
          }
          obj.keywords = text.toLowerCase()
            .split(/\s+/i)
            .filter(isWord)
            .map(createKeyword)
            .sort(sorting[mode]);
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
        var keyword = new Keyword(0, word);
        Keyword.dispose([keyword]);
        highlight(keyword);
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

  function highlight({ word, stem }) {

    setKeyword(function(keyword) {

      if (word === keyword) {
        hide();
        return '';
      }

      show();
      return stem;

    });

    function hide() {

      var elems = document.body.querySelectorAll('div.textarea span.highlight');
      var index = 0;

      tick();

      function tick() {

        var elem = elems[index];

        if (elem) {
          index++;
          elem.classList.remove('highlight');
          requestAnimationFrame(tick);
        }

      }

    }

    function show() {

      var elems = document.body.querySelectorAll('div.textarea');
      var index = 0;
      var regex = new RegExp(`(^|\\W|\>)?(${word})(\\W|$|\<)`, 'ig');
      var replacement = `$1<span class="highlight">$2</span>$3`;

      tick();

      function tick() {

        var elem = elems[index];

        if (elem) {
          index++;
          elem.innerHTML = elem.innerText.replace(regex, replacement);
          requestAnimationFrame(tick);
        }

      }

    }

  }

  return (
    <div ref={ domElement } className={ ['app', highlightIsVisible ? 'highlighting' : '', processing ? 'processing' : ''].join(' ') }>

      <div className={ ['view', 'visualization', vizIsVisible ? 'enabled' : ''].join(' ') }>
        <Results
          objects={ texts }
          keyword={ highlightIsVisible && keyword }
          isHighlighted={ highlightIsVisible }
          onProcessingChange={ (v) => setProcessing(!!v) }
          onSelect={ (stem) => highlight({ word: stem, stem }) } />
      </div>

      <div className={ ['view', 'text', textIsVisible ? 'enabled' : '', highlightIsVisible ? 'highlighting' : ''].join(' ') }>
        { texts.map(render) }
      </div>

      <div className="menu">
        <div id="signum" />
        <button onClick={ increase }>
          Add Text Field
        </button>
        <button onClick={ decrease }>
          Remove Text Field
        </button>
        <button onClick={ cycle }>
          Sort By: { modes[mode] }
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
        <button onClick={ clear }>
          Clear Session
        </button>
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
  return new Keyword(i, word);
}
