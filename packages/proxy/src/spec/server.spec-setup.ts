import { map } from 'rxjs/operators';
import { createContext, HttpEffectResponse, httpListener, r } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';

export const createMarbleServer = () => {
  const echoEffect$ = r.pipe(
    r.matchPath('/'),
    r.matchType('POST'),
    r.useEffect(req$ => req$.pipe(
      map((req): HttpEffectResponse => ({
        headers: {
          'Content-Type': 'text/plain',
        },
        body: req.body,
      }))
    )),
  );

  const errorEffect$ = r.pipe(
    r.matchPath('/'),
    r.matchType('GET'),
    r.useEffect(req$ => req$.pipe(
      map((): HttpEffectResponse => ({
        headers: {
          'Content-Length': '1',
          'Transfer-Encoding': 'chunked',
        },
        body: 'x',
      })),
    )),
  );

  return httpListener({
    middlewares: [
      bodyParser$(),
    ],
    effects: [
      echoEffect$,
      errorEffect$,
    ],
  }).run(createContext());
};
