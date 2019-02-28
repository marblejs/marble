# @marblejs/middleware-logger

A logger middleware for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/middleware-logger
```
Requires `@marblejs/core` to be installed.

## Usage

```javascript
import { logger$ } from '@marblejs/middleware-logger';

const middlewares = [
  logger$(),
  ...
];

const effects = [
  ...
];

export const app = httpListener({ middlewares, effects });
```
License: MIT
