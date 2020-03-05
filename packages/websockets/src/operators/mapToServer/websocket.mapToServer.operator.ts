import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { ServerEvent, ServerEventType } from '@marblejs/core';
import { pathToRegexp } from 'path-to-regexp';
import { Observable, from, EMPTY } from 'rxjs';
import { filter, mergeMap, map, tap, mapTo, toArray, mergeMapTo } from 'rxjs/operators';
import { WebSocketServerConnection } from '../../server/websocket.server.interface';

export type UpgradeEvent = ReturnType<typeof ServerEvent.upgrade>;

type WebSocketServerPathMapping = {
  path: string;
  server: O.Option<WebSocketServerConnection>;
}[];

const isWebSocketUpgrade = ({ request }: UpgradeEvent['payload']) =>
  request.headers.upgrade === 'websocket';

export const mapToServer = (...serverMapping: WebSocketServerPathMapping) => {
  const mapping = serverMapping.map(({ path, server }) => ({
    pathToMatch: pathToRegexp(path),
    server,
  }));

  return (input$: Observable<UpgradeEvent>) =>
    input$.pipe(
      map(event => event.payload),
      filter(isWebSocketUpgrade),
      mergeMap(({ request, socket, head }) => from(mapping).pipe(
        filter(({ pathToMatch }) => pathToMatch.test(request.url || '')),
        tap(({ server }) =>
          pipe(server, O.map(server => server.handleUpgrade(request, socket, head, (ws) =>
            server.emit(ServerEventType.CONNECTION, ws, request)
          ))),
        ),
        mapTo(true),
        toArray(),
        filter(matchedResults => !matchedResults.includes(true)),
        tap(() => socket.destroy()),
      )),
      mergeMapTo(EMPTY),
    );
};
