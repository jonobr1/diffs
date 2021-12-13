import React from 'react';
import dom from 'react-dom';
import App from './app.js';

var domElement = document.createElement('div');
domElement.id = 'react';
document.body.appendChild(domElement);

dom.render(<App />, domElement);
