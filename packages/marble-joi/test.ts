import { validator$, Joi } from './src';
import { httpListener, Effect, matchPath, matchType, combineRoutes, bodyParser$, error$ } from '@marblejs/core';
import { use } from '@marblejs/core/dist/operators/use.operator';
import { map, tap } from 'rxjs/operators';

const root$: Effect = request$ => request$
  .pipe(
    matchPath('/'),
    matchType('GET'),
    map(req => ({
      body: `API root @ ${req.url}`,
    }))
  );

export const api$ = combineRoutes(
  '/api/v1',
  [ root$ ],
);

const createServer = app => {
  const HOSTNAME = '127.0.0.1';
  const PORT = 1337;

  const httpServer = require('http')
    .createServer(app)
    .listen(PORT, HOSTNAME, () => {
      console.log(`Server running @ http://${HOSTNAME}:${PORT}/`);
    });

    httpServer.on('close', () => {
      console.log(`Connection closed`);
    });
};


const middlewares = [
  bodyParser$,
  validator$({ body: {
    id: Joi.string(),
  }})
];

const effect$1: Effect = req$ => req$.pipe(
  matchPath('/test/:id'),
  use(validator$({ params: {
    id: Joi.number().min(1).max(10),
  }})),
  map(req => req.route.params.id),
  map(id => ({ status: 200, body: { id } })),
);

const effects = [
  api$,
  effect$1
];

const listener = httpListener({ middlewares, effects, errorMiddleware: error$ });
createServer(listener);
