<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="200" alt="Marble.js logo"/>
  </a>
</p>

# @marblejs/middleware-body

A request body parser middleware for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/middleware-body
```
Requires `@marblejs/core` to be installed.

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

```typescript
import { bodyParser$ } from '@marblejs/middleware-body';
​
const middlewares = [
  bodyParser$(),
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
