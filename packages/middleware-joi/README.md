Middleware Joi
=======

A [joi](https://github.com/hapijs/joi) validation middleware for [Marble.js](https://github.com/marblejs/marble).

## Usage

Example of using this middleware on a GET route to validate params.

```javascript
import { validator$, Joi } from '@marblejs/middleware-joi';
const foo$: Effect = request$ => request$
  .pipe(
    matchPath('/foo/:id'),
    matchType('GET'),
    use(validator$({
      params: Joi.object({
        id: Joi.number().min(1).max(10),
      })
    }));
    // ...
  );
```

Example to validate all incoming requests.

```javascript
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
