import { InjectionToken, InjectionGetter, ServerEvent, ServerEventType } from '@marblejs/core';
import * as pathToRegexp from 'path-to-regexp';
import { Observable, from, EMPTY } from 'rxjs';
import { filter, mergeMap, map, tap, mapTo, toArray, mergeMapTo } from 'rxjs/operators';
import { MarbleWebSocketServer } from '../../websocket.interface';

export type UpgradeEvent = ReturnType<typeof ServerEvent.upgrade>;

type WebSocketServerCollection = Array<{
  path: string,
  server: InjectionToken,
}>;

const isWebSocketUpgrade = ({ request }: UpgradeEvent['payload']) =>
  request.headers.upgrade === 'websocket';

export const mapToServer = (...servers: WebSocketServerCollection) => (inject: InjectionGetter) => {
  const mappedCollection = servers.map(({ path, server: serverToken }) => ({
    pathToMatch: pathToRegexp(path),
    serverToken,
  }));

  return (input$: Observable<UpgradeEvent>) =>
    input$.pipe(
      map(event => event.payload),
      filter(isWebSocketUpgrade),
      mergeMap(({ request, socket, head }) => from(mappedCollection).pipe(
        filter(({ pathToMatch }) => pathToMatch.test(request.url!)),
        map(({ serverToken }) => inject<MarbleWebSocketServer>(serverToken)),
        map(data => data),
        filter(Boolean),
        tap(server => server.handleUpgrade(request, socket, head, (ws) =>
          server.emit(ServerEventType.CONNECTION, ws, request),
        )),
        mapTo(true),
        toArray(),
        filter(matchedResults => !matchedResults.includes(true)),
        tap(() => socket.destroy()),
      )),
      mergeMapTo(EMPTY),
    );
};
