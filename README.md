Reactive and functional HTTP middleware framework based on <a href="http://nodejs.org" target="blank">Node.js</a> platform to make stream-based APIs development more enjoyable and simpler to write.

## Philosophy

*@TODO*

The name comes from so called `marble diagrams` which are used to visually express time based behaviour of streams.

## Installation

*@TODO*

## Getting started

*@TODO*

### Effects

*Effect* is the main building block of the whole framework. Using its generic interface we can define
API endpoints (so called: `Effects`), middlewares and error handlers (see next chapters).
The simplest implementation of API endpoint can look like this:

```javascript
const endpoint$ = request$ => request$
  .pipe(
    mapTo({ body: `Hello, world!` })
  );
```

The sample *Effect* above matches every HTTP request that passes through `request$` stream and responds with `Hello, world!` message.
Simple as hell, right? Every API *Effect* request has to be mapped to `EffectResponse` object type which can contain
attributes like `body`, `status` or `headers`. If `status` code or `headers` are not passed, then API by default
responds with `200` status and `application/json` content type.

A little bit more complex example can look like this:

```javascript
const postUser$ = request$ => request$
  .pipe(
    matchPath('/user'),
    matchType('POST'),
    map(req => req.body),
    switchMap(Dao.postUser),
    map(response => ({ body: response }))
  );
```

The framework by default comes with two handy operators for matching request urls -`matchPath`- and matching HTTP
request method types -`matchType`-. The example above will match every *POST* request that matches `/user` url.
Using previously parsed POST body (see `$bodyParser` middleware) we can map it to sample **Data Access Object**
which returns a `response` object as an action confirmation.

### Routes composition

Every API requires composable routing. With **Marble.js** routing composition couldn't be easier:

```javascript
const root$ = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    // ...
  );

const foo$ = request$ => request$
  .pipe(
    matchPath('/foo'),
    matchType('GET'),
    // ...
  );

const getUsers$ = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    // ...
  );

const postUser$ = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('POST'),
    // ...
  );

const user$ = combineRoutes(
  '/user',
  [ getUsers$, postUser$ ],
);

const api$ = combineRoutes(
  '/api/v1',
  [ root$, foo$, user$ ],
);
```

Mapped to following API endpoints:
```
GET    /api/v1
GET    /api/v1/foo
GET    /api/v1/user
POST   /api/v1/user
```

### Middlewares

Because everything here is a stream, also plugged-in middlewares are based on simillar *Effect* interface.
By default framework comes with composable middlewares like: logging, request body parsing.
Below you can see how easily looks the dummy implementation of API requests logging middleware.

```javascript
const logger$ = (request$, response) => request$
  .pipe(
    tap(req => console.log(`${req.method} ${req.url}`)),
  );
```

There are two important differences compared to API Effects:
1. stream handler takes a response object as a second argument
2. middlewares must return stream of `request` object at the end of middleware pipeline

In the example above we are taking the stream of request, tapping `console.log` side effect and returning the same
stream as a response of our middleware pipeline. Then all you need to do is to attach the middleware to `httpListener` config.

```javascript
const middlewares = [
  logger$,
];

const app = httpListener({
  middlewares,
  effects,
});
```

### Custom error handling

By default **Marble.js** comes with simple and lightweight error handling middleware.
Because *Middlewares* and *Effects* are based on the same generic interface, your error
handling middlewares works very similar to normal API *Effects*.

```javascript
const error$ = (request$, response, error) => request$
  .pipe(
    map(req => ({
      status: // ...
      body:  // ...
    }),
  );
```

As any other *Effects* error middleware maps the stream of errored requests to objects of type `EffectsResponse`.
The only one difference is that it takes as a third argument an intercepted error object which can be used
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

## Examples

To view the example project structure, clone the **Marble.js** repository and install the dependencies:

```bash
$ git clone git://github.com/marblejs/marble.git
$ cd marble
$ npm install
```

To run example just execute following command inside root repository folder:

```bash
$ npm run example
```

## Authors

<table>
  <tr>
    <td>
      <a href="https://github.com/JozefFlakus" style="color: white">
        <img src="https://github.com/JozefFlakus.png?s=150" width="100"/>
        <p style="text-align: center"><small>Józef Flakus</small></p>
      </a>
    </td>
  </tr>
</table>

## License

marble.js is MIT licensed
