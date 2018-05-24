# README

 [![Marble.js logo](https://github.com/marblejs/marble/blob/master/docs/assets/logo.png?raw=true)](http://marblejs.com)

 [![Travis-CI status](https://travis-ci.com/marblejs/marble.svg?branch=master)](https://www.npmjs.com/package/@marblejs/core) [![npm version](https://badge.fury.io/js/%40marblejs%2Fcore.svg)](https://badge.fury.io/js/%40marblejs%2Fcore) [![Codecov coverage](https://codecov.io/gh/marblejs/marble/coverage.svg?branch=master)](https://codecov.io/gh/marblejs/marble?branch=master) [![Maintained with lerna](https://img.shields.io/badge/maintained%20with-lerna-cc00ff.svg)](https://lernajs.io)

 Functional reactive HTTP middleware framework built on top of [Node.js](http://nodejs.org) platform, [TypeScript](https://www.typescriptlang.org) and [RxJS](http://reactivex.io/rxjs) library.

## Table of content

1. [Philosophy](./#philosophy)
2. [Installation](./#instal)
3. [Getting started](./#start)
4. [Effects](./#effects)
5. [Routes composition](./#routing)
6. [Middlewares](./#middlewares)
7. [Custom error handling](./#error)
8. [Examples](./#examples)
9. [Roadmap](./#roadmap)

##  Philosophy

> If you don't have any experience with functional reactive programming, we strongly recommend to gain some basic overview first with [ReactiveX intro](http://reactivex.io/intro.html) or with [The introduction to Reactive Programming you've been missing](https://gist.github.com/staltz/868e7e9bc2a7b8c1f754) written by [@andrestaltz](https://twitter.com/andrestaltz).

If we think closely how typical HTTP API works we can quickly recognize that it deals with streams of asynchronous events also called as HTTP requests. Describing it very briefly - typically each request needs to be transformed into response that goes back to the client \(which is our event initiator\) using custom middlewares or designated endpoints. In reactive programming world, all those core concepts we can translate into very simple marble diagram:

![Marble.js core concept](https://github.com/marblejs/marble/blob/master/docs/assets/flow.png?raw=true)

In this world everything is a stream. The core concept of **Marble.js** is based on the event flow of marble diagrams which are used to visually express time based behavior of HTTP streams. Ok, but why the heck we need those `observables`? Trends come and go, but asynchronously nature of JavaScript and Node.js platform constantly evolves. With reactive manner we can deliver complex features faster by providing the ability to compose complex tasks with ease and with less amount of code. If you have ever worked with libraries like [Redux Observable](https://redux-observable.js.org), [@ngrx/effects](https://github.com/ngrx/platform/blob/master/docs/effects/README.md) or other libraries that leverages functional reactive paradigm, you will feel like at home. Still there? So lets get started!

##  Installation

**Marble.js** requires node **v8.0** or higher:

```javascript
$ npm i @marblejs/core rxjs
```

or if you are a hipster:

```javascript
$ yarn add @marblejs/core rxjs
```

##  Getting started

The bootstrapping consists of two very simple steps: _HTTP handler_ definition and _HTTP server_ configuration.

`httpListener` is the starting point of every _Marble.js_ application. It includes definitions of all _middlewares_ and API _effects_.

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

Because **Marble.js** is built on top of **Node.js** platform and doesn't create any abstractions for server bootstrapping - all you need to do is to call `createServer` with initialized _app_ and then start listening to given _port_ and _hostname_.

```javascript
const httpServer = http
  .createServer(app)
  .listen(PORT, HOSTNAME);
```

###  Effects

_Effect_ is the main building block of the whole framework. Using its generic interface we can define API endpoints \(so called: `Effects`\), middlewares and error handlers \(see next chapters\). The simplest implementation of API endpoint can look like this:

```javascript
const endpoint$: Effect = request$ => request$
  .pipe(
    mapTo({ body: `Hello, world!` })
  );
```

The sample _Effect_ above matches every HTTP request that passes through `request$` stream and responds with `Hello, world!` message. Simple as hell, right?

Every API _Effect_ request has to be mapped to object which can contain attributes like `body`, `status` or `headers`. If _status_ code or _headers_ are not passed, then API by default will respond with `200` status and `application/json` _Content -Type_ header.

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

The framework by default comes with two handy operators for matching urls \(`matchPath`\) and matching method types \(`matchType`\). The example above will match every _POST_ request that matches to `/user` url. Using previously parsed POST body \(see `$bodyParser` middleware\) we can map it to sample _DAO_ which returns a `response` object as an action confirmation.

_The_ `matchType` _operator can also deal with parameterized URLs like_ `/foo/:id/bar`

###  Routes composition

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

_Effects_ above will be mapped to following API endpoints:

```text
GET    /api/v1
GET    /api/v1/foo
GET    /api/v1/user
POST   /api/v1/user
```

###  Middlewares

Because everything here is a stream, also plugged-in middlewares are based on similar _Effect_ interface. By default framework comes with composable middlewares like: logging, request body parsing. Below you can see how easily looks the dummy implementation of API requests logging middleware.

```javascript
const logger$: Effect<HttpRequest> = (request$, response) => request$
  .pipe(
    tap(req => console.log(`${req.method} ${req.url}`)),
  );
```

There are two important differences compared to API Effects: 1. stream handler takes a response object as a second argument 2. middlewares must return a stream of _requests_ at the end of middleware pipeline

In the example above we are getting the stream of _requests_, tapping `console.log` side effect and returning the same stream as a response of our middleware pipeline. Then all you need to do is to attach the middleware to `httpListener` config.

```javascript
const middlewares = [
  logger$,
];

const app = httpListener({ middlewares, effects });
```

###  Custom error handling

By default **Marble.js** comes with simple and lightweight error handling middleware. Because _Middlewares_ and _Effects_ are based on the same generic interface, your error handling middlewares works very similar to normal API _Effects_.

```javascript
const error$: Effect<EffectResponse, ThrownError> = (request$, response, error) => request$
  .pipe(
    map(req => ({
      status: // ...
      body:  // ...
    }),
  );
```

As any other _Effects_, error middleware maps the stream of errored requests to objects of type `EffectsResponse` \(`status`, `body`, `headers`\). The difference is that it takes as a third argument an intercepted error object which can be used for error handling-related logic.

To connect the custom middleware, all you need to do is to attach it to `errorMiddleware` property in `httpListener` config object.

```javascript
const app = httpListener({
  middlewares,
  effects,

  // Custom error middleware:
  errorMiddleware: error$,
});
```

##  Examples

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

##  Roadmap

**Marble.js** is not yet a final and production ready product. Its APIs can improve over time when reaching stable version `1.0.0`. But in the meantime you can play easily and contribute to the growing community of functional reactive programming freaks.

* [x] core mechanics
* [x] custom middlewares
* [x] custom error handlers
* [x] composable routing
* [x] intercepting url parameters \(via `matchPath` operator\) _\(v0.3.0\)_
* [x] ability to compose midddlewares inside `Effect` pipeline _\(v0.3.0\)_
* [x] intercepting query parameters _\(v0.3.0\)_
* [ ] more middlewares! \(can think about moving `logger$` and `bodyParser$` outside core library\)
* [ ] testing utilities
* [ ] improved, dedicated documentation \(to move outside README\)

## Authors

|  [![](https://github.com/JozefFlakus.png?s=150)](https://github.com/JozefFlakus) | **Józef Flakuscontact:** [hello@jflakus.com](mailto:hello@jflakus.com)**twitter:** [@jozflakus](https://twitter.com/jozflakus) |
| --- |


## Contributors

|  [![](https://github.com/sebastianmusial.png?s=150)Sebastian Musial](https://github.com/sebastianmusial) |  [![](https://github.com/pdomaleczny.png?s=150)Patryk Domałeczny](https://github.com/pdomaleczny) |
| --- |


## License

marble.js is MIT licensed

