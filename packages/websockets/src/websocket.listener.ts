import * as http from 'http';
import * as WebSocket from 'ws';
import { Subject, of, NEVER } from 'rxjs';
import { tap, mergeMap, catchError, map } from 'rxjs/operators';
import { Socket } from './websocket.interface';
import { WebSocketMiddleware, WebSocketErrorEffect } from './effects/ws-effects.interface';
// import { combineWebSocketMiddlewares } from './effects/ws-effects.combiner';
// import { factorizeRouting } from './router/ws-router.factory';
import { WebSocketRoute } from './router/ws-router.interface';
import { socketJsonParser } from './parsers/json.parser';

type WebSocketListenerConfig = {
  effects: WebSocketRoute[];
  middlewares?: WebSocketMiddleware[];
  errorEffect?: WebSocketErrorEffect;
};

export const webSocketListener = ({ middlewares = [], effects, errorEffect }: WebSocketListenerConfig) => {
  const event$ = new Subject<Socket>();
  // const combinedMiddlewares = combineWebSocketMiddlewares(middlewares);
  // const factorizedRouting = factorizeRouting(effects, middlewares);
  const effect$ = event$.pipe(
    map(socketJsonParser),
    mergeMap(socket => of(socket).pipe(
      tap(socket => {

        // @TODO
        socket.server.clients.forEach(c => {

          // @TODO
          console.log(socket.event);
          c.send(JSON.stringify(socket.event));
        });
      }),
    )),
    catchError(error => {

      // @TODO
      console.log(error);
      return NEVER;
    })
  );

  effect$.subscribe();

  return (server: http.Server) => {
    const wsServer = new WebSocket.Server({ server });

    wsServer.on('connection', client =>
      client.on('message', event =>
        event$.next({ event, client, server: wsServer }),
      ),
    );

    return wsServer;
  };
};
