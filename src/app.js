import React, { useEffect, useRef, useState } from 'react';

import "./main.css";

export default function App(props) {

  var [texts, setTexts] = useState([{}]);

  useEffect(setup, []);

  function setup() {

  }

  function increase() {
    setTexts(function(text) {
      var result = text.slice(0);
      result.push({});
      return result;
    });
  }

  function reduce() {
    setTexts(function(text) {
      var result = text.slice(0);
      result.pop();
      return result;
    });
  }

  //

  function render(text, i) {
    var styles = {
      width: `${(100 / texts.length).toFixed(3)}vw`
    };
    return (
      <div key={ i } className="column" style={ styles }>
        <textarea />
      </div>
    );
  }

  return (
    <div className="app">

      <div className="content">
        { texts.map(render) }
      </div>

      <div className="menu">
        <button onClick={ reduce }>
          Remove Text Field
        </button>
        <button onClick={ increase }>
          Add Text Field
        </button>
      </div>

    </div>
  );

}
