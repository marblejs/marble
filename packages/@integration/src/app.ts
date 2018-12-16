import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerDev$, loggerFile$ } from './middlewares/logger.middleware';
import { api$ } from './effects/api.effects';
import { webSocketListener, WebSocketEffectFactory, WebSocketEvent } from '../../websockets/src';
import { mergeMap, map, delay, concatMap } from 'rxjs/operators';
import { from, of } from 'rxjs';

const effect$ = WebSocketEffectFactory
  .matchType('TEST')
  .use(event$ => event$.pipe(
    map(event => event as WebSocketEvent<{ counter: number }>),
    mergeMap(event => from([event.data.counter, event.data.counter + 1,  event.data.counter + 2]).pipe(
      concatMap(counter => of(counter).pipe(delay(1000))),
      map(counter => ({
        type: event.type,
        payload: { counter },
      })),
    )),
  ));

export const app = httpListener({
  middlewares: [
    loggerDev$,
    loggerFile$,
    bodyParser$,
  ],
  effects: [api$]
});

export const ws = webSocketListener({
  middlewares: [],
  effects: [effect$],
});
