import { IncomingMessage, OutgoingMessage } from 'http';
import { pipe } from 'fp-ts/lib/pipeable';
import * as R from 'fp-ts/lib/Reader';
import { throwError } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { combineMiddlewares } from '../effects/effects.combiner';
import {
  HttpMiddlewareEffect,
  HttpErrorEffect,
  HttpOutputEffect,
} from '../effects/http-effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { handleResponse } from '../response/response.handler';
import { RouteEffect, RouteEffectGroup, RoutingItem } from '../router/router.interface';
import { resolveRouting } from '../router/router.resolver.v2';
import { factorizeRouting } from '../router/router.factory';
import { Context, lookup } from '../context/context.factory';
import { createEffectContext } from '../effects/effectsContext.factory';
import { useContext } from '../context/context.hook';
import { ServerClientToken } from '../server/server.tokens';
import { r } from '../router/router.ixbuilder';
import { HttpError } from '../error/error.model';

export interface HttpListenerConfig {
  middlewares?: HttpMiddlewareEffect[];
  effects: (RouteEffect | RouteEffectGroup)[];
  error$?: HttpErrorEffect;
  output$?: HttpOutputEffect;
}

export interface HttpListener {
  (req: IncomingMessage, res: OutgoingMessage): void;
  config: { routing: RoutingItem[] };
};

export const httpListener = ({
  middlewares = [],
  effects,
  output$,
  error$,
}: HttpListenerConfig): R.Reader<Context, HttpListener> => pipe(
  R.ask<Context>(),
  R.map(ctx => {

    const notFound$ = r.pipe(
      r.matchPath('*'),
      r.matchType('*'),
      r.useEffect(req$ => req$.pipe(
        mergeMap(() => throwError(
          new HttpError('Route not found', HttpStatus.NOT_FOUND)
        )),
      )));

    const ask = lookup(ctx);
    const client = useContext(ServerClientToken)(ask);
    const effectContext = createEffectContext({ ask, client });
    const middleware$ = combineMiddlewares(...middlewares);
    const routing = factorizeRouting([...effects, notFound$]);
    const { resolve, outputSubject } = resolveRouting(routing, effectContext)(middleware$, output$, error$);

    const httpServer = (req: IncomingMessage, res: OutgoingMessage) => {
      const marbleReq = req as HttpRequest;
      const marbleRes = res as HttpResponse;

      marbleRes.send = handleResponse(marbleRes)(marbleReq);
      marbleReq.response = marbleRes;

      const subject = resolve(marbleReq);

      if (subject) {
        subject.next(marbleReq);
      } else {
        outputSubject.next({ req: marbleReq, res: { status: HttpStatus.NOT_FOUND }});
      }
    };

    httpServer.config = { routing };

    return httpServer;
  }),
);
