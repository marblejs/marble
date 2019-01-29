Middleware Cors
=======

A CORS middleware for [Marble.js](https://github.com/marblejs/marble).

## Usage

Example of using this middleware on a GET route.

```javascript
import { cors$ } from '@marblejs/middleware-cors';

const foo$ = EffectFactory
  .matchPath('/foo/:id')
  .matchType('GET')
  .use(req$ => req$.pipe(
    use(cors$({
      origin: 'https://foo.bar',
    }));
    // ...
  ));
```

Example to allow all incoming requests.

```javascript
import { cors$ } from '@marblejs/middleware-cors';

const middlewares = [
  logger$,
  cors$({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    withCredentials: false,
    optionsSuccessStatus: 204,
    allowHeaders: '*',
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
