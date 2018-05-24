<p align="center">
  <a href="http://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/docs/assets/logo.png?raw=true" width="320" alt="Marble.js logo"/>
  </a>
</p>

<p align="center">
<a href="https://www.npmjs.com/package/@marblejs/core">
  <img src="https://travis-ci.com/marblejs/marble.svg?branch=master" alt="Travis-CI status" height="18">
</a>
<a href="https://badge.fury.io/js/%40marblejs%2Fcore">
  <img src="https://badge.fury.io/js/%40marblejs%2Fcore.svg" alt="npm version" height="18">
</a>
<a href="https://codecov.io/gh/marblejs/marble?branch=master">
  <img src="https://codecov.io/gh/marblejs/marble/coverage.svg?branch=master" alt="Codecov coverage" height="18">
</a>
<a href="https://lernajs.io">
  <img src="https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg" alt="Maintained with lerna" height="18">
</a>
</p>

<p align="center">
Functional reactive HTTP middleware framework built on top of <a href="http://nodejs.org" target="blank">Node.js</a> platform, <a href="https://www.typescriptlang.org" target="blank">TypeScript</a> and <a href="http://reactivex.io/rxjs" target="blank">RxJS</a> library.
</p>

## Table of content

 1. [Philosophy](#philosophy)
 2. [Installation](#instal)
 3. [Getting started](#start)
 4. [Effects](#effects)
 5. [Routes composition](#routing)
 6. [Middlewares](#middlewares)
 7. [Custom error handling](#error)
 8. [Examples](#examples)
 9. [Roadmap](#roadmap)

## <a name="philosophy"></a> Philosophy

> If you don't have any experience with functional reactive programming, we strongly recommend to gain some basic overview first with <a href="http://reactivex.io/intro.html" target="blank">ReactiveX intro</a> or with <a href="https://gist.github.com/staltz/868e7e9bc2a7b8c1f754" target="blank">The introduction to Reactive Programming you've been missing</a> written by <a href="https://twitter.com/andrestaltz" target="blank">@andrestaltz</a>.

If we think closely how typical HTTP API works we can quickly recognize that it deals with streams of asynchronous events also called as HTTP requests. Describing it very briefly - typically each request needs to be transformed into response that goes back to the client (which is our event initiator) using custom middlewares or designated endpoints. In reactive programming world, all those core concepts we can translate into very simple marble diagram:

![Marble.js core concept](https://github.com/marblejs/marble/blob/master/docs/assets/flow.png?raw=true)

In this world everything is a stream. The core concept of **Marble.js** is based on the event flow of marble diagrams which are used to visually express time based behavior of HTTP streams. Ok, but why the heck we need those `observables`? Trends come and go, but asynchronously nature of JavaScript and Node.js platform constantly evolves. With reactive manner we can deliver complex features faster by providing the ability to compose complex tasks with ease and with less amount of code. If you have ever worked with libraries like <a href="https://redux-observable.js.org" target="blank">Redux Observable</a>, <a href="https://github.com/ngrx/platform/blob/master/docs/effects/README.md" target="blank">@ngrx/effects</a> or other libraries that leverages functional reactive paradigm, you will feel like at home. Still there? So lets get started!

## <a name="instal"></a> Installation

**Marble.js** requires node **v8.0** or higher:

```javascript
$ npm i @marblejs/core rxjs
```

or if you are a hipster:

```javascript
$ yarn add @marblejs/core rxjs
```

## <a name="start"></a> Getting started

The bootstrapping consists of two very simple steps: *HTTP handler* definition and *HTTP server* configuration.

`httpListener` is the starting point of every *Marble.js* application. It includes definitions of all *middlewares* and API *effects*.

```javascript

const middlewares = [
  logger$,
  bodyParser$,
];

const effects = [
  endpoint1$,
  endpoint2$,
  ...
];

const app = httpListener({ middlewares, effects });
```

Because **Marble.js** is built on top of **Node.js** platform and doesn't create any abstractions for server bootstrapping - all you need to do is to call `createServer` with initialized *app* and then start listening to given *port* and *hostname*.

```javascript
const httpServer = http
  .createServer(app)
  .listen(PORT, HOSTNAME);
```

### <a name="effects"></a> Effects

*Effect* is the main building block of the whole framework. Using its generic interface we can define
API endpoints (so called: `Effects`), middlewares and error handlers (see next chapters).
The simplest implementation of API endpoint can look like this:

```javascript
const endpoint$: Effect = request$ => request$
  .pipe(
    mapTo({ body: `Hello, world!` })
  );
```

The sample *Effect* above matches every HTTP request that passes through `request$` stream and responds with `Hello, world!` message. Simple as hell, right?

Every API *Effect* request has to be mapped to object which can contain attributes like `body`, `status` or `headers`. If *status* code or *headers* are not passed, then API by default will respond with `200` status and `application/json` *Content -Type* header.

A little bit more complex example can look like this:

```javascript
const postUser$: Effect = request$ => request$
  .pipe(
    matchPath('/user'),
    matchType('POST'),
    map(req => req.body),
    switchMap(Dao.postUser),
    map(response => ({ body: response }))
  );
```

The framework by default comes with two handy operators for matching urls (`matchPath`) and matching
method types (`matchType`). The example above will match every *POST* request that matches to `/user` url.
Using previously parsed POST body (see `$bodyParser` middleware) we can map it to sample *DAO*
which returns a `response` object as an action confirmation.

*The `matchType` operator can also deal with parameterized URLs like `/foo/:id/bar`*

### <a name="routing"></a> Routes composition

Every API requires composable routing. With **Marble.js** routing composition couldn't be easier:

```javascript
// user.controller.ts

const getUsers$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    // ...
  );

const postUser$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('POST'),
    // ...
  );

export const user$ = combineRoutes(
  '/user',
  [ getUsers$, postUser$ ],
);

// api.controller.ts

import { user$ } from 'user.controller.ts';

const root$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    // ...
  );

const foo$: Effect = request$ => request$
  .pipe(
    matchPath('/foo'),
    matchType('GET'),
    // ...
  );

const api$ = combineRoutes(
  '/api/v1',
  [ root$, foo$, user$ ],
);
```

*Effects* above will be mapped to following API endpoints:
```
GET    /api/v1
GET    /api/v1/foo
GET    /api/v1/user
POST   /api/v1/user
```

### <a name="middlewares"></a> Middlewares

Because everything here is a stream, also plugged-in middlewares are based on similar *Effect* interface.
By default framework comes with composable middlewares like: logging, request body parsing.
Below you can see how easily looks the dummy implementation of API requests logging middleware.

```javascript
const logger$: Effect<HttpRequest> = (request$, response) => request$
  .pipe(
    tap(req => console.log(`${req.method} ${req.url}`)),
  );
```

There are two important differences compared to API Effects:
1. stream handler takes a response object as a second argument
2. middlewares must return a stream of *requests* at the end of middleware pipeline

In the example above we are getting the stream of *requests*, tapping `console.log` side effect and returning the same
stream as a response of our middleware pipeline. Then all you need to do is to attach the middleware to `httpListener` config.

```javascript
const middlewares = [
  logger$,
];

const app = httpListener({ middlewares, effects });
```

### <a name="error"></a> Custom error handling

By default **Marble.js** comes with simple and lightweight error handling middleware.
Because *Middlewares* and *Effects* are based on the same generic interface, your error
handling middlewares works very similar to normal API *Effects*.

```javascript
const error$: Effect<EffectResponse, ThrownError> = (request$, response, error) => request$
  .pipe(
    map(req => ({
      status: // ...
      body:  // ...
    }),
  );
```

As any other *Effects*, error middleware maps the stream of errored requests to objects of type `EffectsResponse` (`status`, `body`, `headers`). The difference is that it takes as a third argument an intercepted error object which can be used
for error handling-related logic.

To connect the custom middleware, all you need to do is to attach it to `errorMiddleware` property in
`httpListener` config object.

```javascript
const app = httpListener({
  middlewares,
  effects,

  // Custom error middleware:
  errorMiddleware: error$,
});
```

## <a name="examples"></a> Examples

To view the example project structure, clone the **Marble.js** repository and install the dependencies:

```bash
$ git clone git://github.com/marblejs/marble.git
$ cd marble/example
$ npm i
```

To run example just execute following command inside root repository folder:

```bash
$ npm run start
```

## <a name="roadmap"></a> Roadmap

**Marble.js** is not yet a final and production ready product. Its APIs can improve over time when reaching stable version `1.0.0`. But in the meantime you can play easily and contribute to the growing community of functional reactive programming freaks.

- [x] core mechanics
- [x] custom middlewares
- [x] custom error handlers
- [x] composable routing
- [x] intercepting url parameters (via `matchPath` operator) *(v0.3.0)*
- [x] ability to compose midddlewares inside `Effect` pipeline *(v0.3.0)*
- [ ] intercepting query parameters *(v0.3.0)*
- [ ] more middlewares! (can think about moving `logger$` and `bodyParser$` outside core library)
- [ ] testing utilities
- [ ] improved, dedicated documentation (to move outside README)

## Authors

<table border="0">
  <tr>
    <td>
      <a href="https://github.com/JozefFlakus" style="color: white">
        <img src="https://github.com/JozefFlakus.png?s=150" width="150"/>
      </a>
    </td>
    <td>
      <p><strong>Józef Flakus</strong></p>
      <p><strong>contact: </strong><a href="mailto:hello@jflakus.com">hello@jflakus.com</a></p>
      <p><strong>twitter: </strong><a href="https://twitter.com/jozflakus">@jozflakus</a></p>
    </td>
  </tr>
</table>

## Contributors

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/sebastianmusial" style="color: white">
        <img src="https://github.com/sebastianmusial.png?s=150" width="100"/>
        <p style="text-align: center"><small>Sebastian Musial</small></p>
      </a>
    </td>
    <td align="center">
      <a href="https://github.com/pdomaleczny" style="color: white">
        <img src="https://github.com/pdomaleczny.png?s=150" width="100"/>
        <p style="text-align: center"><small>Patryk Domałeczny</small></p>
      </a>
    </td>
  </tr>
</table>

## License

marble.js is MIT licensed
