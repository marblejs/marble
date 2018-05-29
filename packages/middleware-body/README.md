# @marblejs/middleware-body

A request body parser middleware for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/middleware-body
```
Requires `@marblejs/core` to be installed.

## Usage

```javascript
import { bodyParser$ } from '@marblejs/middleware-body';
​
const middlewares = [
  bodyParser$,
  // ...
];
​
const effects = [
  // ...
];
​
export const app = httpListener({ middlewares, effects });
```
License: MIT
