import React, { useEffect, useRef, useState } from 'react';

import "./main.css";

export default function App(props) {

  var [texts, setTexts] = useState([]);

  useEffect(setup, []);

  function setup() {

  }

  function add() {
    setTexts(function(text) {
      var result = text.slice(0);
      result.push({});
      return result;
    });
  }

  //

  function render(text, i) {
    return (
      <div key={ i } className="column">
        <textarea />
      </div>
    );
  }

  return (
    <div className="app">

      <div className="content">
        { texts.map(render) }
      </div>

      <div className="actions">
        <button onClick={ add }>
          +
        </button>
      </div>

    </div>
  );

}
