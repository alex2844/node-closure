# node-closure

[![Version](https://img.shields.io/npm/v/node-closure.svg)](https://www.npmjs.org/package/node-closure)

Converts ec6 to es5 and minimizes not only JavaScripts, but also CSS and HTML under the current directory tree

Minify all files
```javascript
require('node-closure').build();
```
Minify one file
```javascript
require('node-closure').build('lib.js');
```
Enable debug
```javascript
var closure = require('node-closure');
closure.debug = true;
closure.ignore = ['**/node_modules/**', '**/upload/**'];
closure.build();
```
Set callback
```javascript
var closure = require('node-closure');
closure.callback = console.log.bind(console);
closure.build();
```

## Installation
```
npm install -g node-closure
```
