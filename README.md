Reactive and functional HTTP middleware framework based on <a href="http://nodejs.org" target="blank">Node.js</a> platform to make stream-based APIs development more enjoyable and simpler to write.

## Philosophy

*@TODO*

The name comes from so called `marble diagrams` which are used to visually express time based behaviour of streams.

## Installation

*@TODO*

## Getting started

*@TODO*

### Effects

*@TODO*

### Routing

*@TODO*

### Middlewares

Because everyting here is a stream, also plugged-in middlewares are based on simillar *Effect* interface.
By default framework comes with composable middlewares like: logging, request body parsing.
Below you can see how easily looks the dummy implementation of API requests logging middleware.

```javascript
export const logger$ = (request$, response) => request$
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

export const app = httpListener({
  middlewares,
  effects,
});
```

### Custom error handling

By default **Marble.js** comes with simple and lightweight error handling middleware.
Because *Middlewares* and *Effects* are based on the same generic interface, your error
handling middlewares works very similar to normal API *Effects*.

```javascript
export const error$ = (request$, response, error) => request$
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
export const app = httpListener({
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
