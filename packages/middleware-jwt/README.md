# @marblejs/middleware-jwt

A [JWT](http://jwt.io) middleware for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/middleware-jwt
```
Requires `@marblejs/core` to be installed.

## Usage

**Generate token:**
```typescript
import { EffectFactory } from '@marblejs/core';
import { generateToken } from '@marblejs/middleware-jwt';
import { SECRET_KEY } from './config';

const login$ = EffectFactory
  .matchPath('/login')
  .matchType('POST')
  .use(req$ => req$.pipe(
    //
    map(payload => generateToken({ secret: SECRET_KEY })(payload)), 👈
    // ...
  ));
```

**Validate routes:**
```typescript
import { EffectFactory } from '@marblejs/core';
import { authorize$ } from '@marblejs/middleware-jwt';
import { SECRET_KEY } from './config';

const getUsers$ = EffectFactory
  .matchPath('/')
  .matchType('GET')
  .use(req$ => req$.pipe(
    // ...
  ));

const user$ = combineRoutes('/user', {
  effects: [
    getUsers$
  ],
  middlewares: [
    authorize$({ secret: SECRET_KEY }) 👈
  ],
});
```
License: MIT
