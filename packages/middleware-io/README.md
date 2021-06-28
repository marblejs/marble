<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="200" alt="Marble.js logo"/>
  </a>
</p>

# @marblejs/middleware-io

IO validation middleware for Marble.js for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/middleware-io
```
Requires `@marblejs/core` to be installed.

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

```typescript
import { r } from '@marblejs/http';
import { requestValidator$, t } from '@marblejs/middleware-io';

const userSchema = t.type({
  id: t.string,
  firstName: t.string,
  lastName: t.string,
  roles: t.array(t.union([
    t.literal('ADMIN'),
    t.literal('GUEST'),
  ])),
});

type User = t.TypeOf<typeof userSchema>;

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    requestValidator$({ body: userSchema }),
    // ..
  )));
```
License: MIT
