import { r, HttpStatus, combineRoutes, useContext } from '@marblejs/core';
import { EventBusClientToken } from '@marblejs/messaging';
import { tap, mapTo, map, mergeMap } from 'rxjs/operators';

const emit$ = r.pipe(
  r.matchPath('/emit'),
  r.matchType('GET'),
  r.useEffect((req$, ctx) => {
    const eventBusClient = useContext(EventBusClientToken)(ctx.ask);

    return req$.pipe(
      tap(() => eventBusClient.emit({ type: 'TEST' })),
      mapTo({ status: HttpStatus.ACCEPTED }),
    );
  }));

const send$ = r.pipe(
  r.matchPath('/send'),
  r.matchType('GET'),
  r.useEffect((req$, ctx) => {
    const eventBusClient = useContext(EventBusClientToken)(ctx.ask);

    return req$.pipe(
      mergeMap(() => eventBusClient.send({ type: 'TEST' })),
      map(body => ({ body })),
    );
  }));

export const eventBus$ = combineRoutes(
  '/event',
  [ emit$, send$ ],
);
