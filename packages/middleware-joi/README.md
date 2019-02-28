# @marblejs/middleware-joi

<a href="https://marblejs.com">
  <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="320" alt="Marble.js logo"/>
</a>


A [joi](https://github.com/hapijs/joi) validation middleware for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/middleware-joi
```
Requires `@marblejs/core` to be installed.

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

Example of using this middleware on a GET route to validate params.

```typescript
import { validator$, Joi } from '@marblejs/middleware-joi';

const foo$ = r.pipe(
  r.matchPath('/foo/:id'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    use(validator$({
      params: Joi.object({
        id: Joi.number().min(1).max(10),
      })
    }));
    // ...
  )));
```

Example to validate all incoming requests.

```typescript
import { validator$, Joi } from '@marblejs/middleware-joi';

const middlewares = [
  logger$,
  validator$({
    headers: Joi.object({
      sign: Joi.string(),
      accept: Joi.string().default('application/json'),
    }),
    params: Joi.object({
      apiKey: Joi.string().token().required(),
    })
  })
];

const effects = [
  endpoint1$,
  endpoint2$,
  ...
];

const app = httpListener({ middlewares, effects });
```

License: MIT
