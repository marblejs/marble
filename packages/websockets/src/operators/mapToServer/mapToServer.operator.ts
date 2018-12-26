import { Event, EventType, InjectionToken, InjectionGetter } from '@marblejs/core';
import * as http from 'http';
import * as pathToRegexp from 'path-to-regexp';
import { Observable, from, EMPTY } from 'rxjs';
import { filter, mergeMap, map, tap, mapTo, toArray, mergeMapTo } from 'rxjs/operators';
import { MarbleWebSocketServer } from '../../websocket.interface';

type UpgradeEventData = NonNullable<(typeof Event.UPGRADE)['data']>;

type WebSocketServerCollection = Array<{
  path: string,
  server: InjectionToken,
}>;

const isWebSocketUpgrade = ([ req ]: [http.IncomingMessage, ...any[]]) =>
  req.headers.upgrade === 'websocket';

export const mapToServer = (...servers: WebSocketServerCollection) => (inject: InjectionGetter) => {
  const mappedCollection = servers.map(({ path, server: serverToken }) => ({
    pathToMatch: pathToRegexp(path),
    serverToken,
  }));

  return (input$: Observable<UpgradeEventData>): Observable<any> =>
    input$.pipe(
      filter(isWebSocketUpgrade),
      mergeMap(([ req, socket, head ]) => from(mappedCollection).pipe(
        filter(({ pathToMatch }) => pathToMatch.test(req.url!)),
        map(({ serverToken }) => inject<MarbleWebSocketServer>(serverToken)),
        filter(Boolean),
        tap(server => server.handleUpgrade(req, socket, head, (ws) =>
          server.emit(EventType.CONNECTION, ws, req),
        )),
        mapTo(true),
        toArray(),
        filter(matchedResults => !matchedResults.includes(true)),
        tap(socket.destroy),
      )),
      mergeMapTo(EMPTY),
    );
};
