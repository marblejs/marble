# @marblejs/middleware-io

<a href="https://marblejs.com">
  <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="320" alt="Marble.js logo"/>
</a>

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
import { use, r } from '@marblejs/core';
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
    use(requestValidator$({ body: userSchema })),
    // ..
  )));
```
License: MIT
