Middleware CORS
=======

A CORS middleware for [Marble.js](https://github.com/marblejs/marble).

## Usage

Example to allow incoming requests.

```typescript
import { cors$ } from '@marblejs/middleware-cors';

const middlewares = [
  logger$,
  cors$({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    optionsSuccessStatus: 204,
    allowHeaders: '*',
    maxAge: 3600,
  })
];

const effects = [
  endpoint1$,
  endpoint2$,
  ...
];

const app = httpListener({ middlewares, effects });
```

## Available options

To configure CORS middleware you can follow this interface.

```typescript
interface CORSOptions {
  origin?: string | string[] | RegExp;
  methods?: HttpMethod[];
  optionsSuccessStatus?: HttpStatus;
  allowHeaders?: string | string[];
  exposeHeaders?: string[];
  withCredentials?: boolean;
  maxAge?: number;
}
```

License: MIT
