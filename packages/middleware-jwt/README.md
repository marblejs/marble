# @marblejs/middleware-jwt

<a href="https://marblejs.com">
  <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="320" alt="Marble.js logo"/>
</a>


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

**Validate payload:**
```typescript
const verifyPayload$ = (payload: { id: string }) =>
  of(payload).pipe(
    map(payload => payload.id),
    flatMap(UserRepository.findById),  // the repository can throw an error if not found or...
    catchError(/* ... */)              // the `verifyPayload$` can throw it explicitly
  );
```

**Validate routes:**
```typescript
import { r } from '@marblejs/core';
import { authorize$ } from '@marblejs/middleware-jwt';
import { SECRET_KEY } from './config';

const getUsers$ = r.pipe(
  r.matchPath('/'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    // ...
  )));

const user$ = combineRoutes('/user', {
  effects: [
    getUsers$
  ],
  middlewares: [
    authorize$({ secret: SECRET_KEY }, validatePayload$) 👈
  ],
});
```
License: MIT
