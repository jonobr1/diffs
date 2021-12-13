import React from 'react';
import dom from 'react-dom';

var domElement = document.createElement('div');
domElement.id = 'react';
document.body.appendChild(domElement);

dom.render(<h1>Hello World</h1>, domElement);
