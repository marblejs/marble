import { Option } from 'fp-ts/lib/Option';
import { ServerEvent, ServerEventType } from '@marblejs/core';
import * as pathToRegexp from 'path-to-regexp';
import { Observable, from, EMPTY } from 'rxjs';
import { filter, mergeMap, map, tap, mapTo, toArray, mergeMapTo } from 'rxjs/operators';
import { MarbleWebSocketServer } from '../../websocket.interface';

export type UpgradeEvent = ReturnType<typeof ServerEvent.upgrade>;

type WebSocketServerCollection = Array<{
  path: string,
  server: Option<MarbleWebSocketServer>,
}>;

const isWebSocketUpgrade = ({ request }: UpgradeEvent['payload']) =>
  request.headers.upgrade === 'websocket';

export const mapToServer = (...servers: WebSocketServerCollection) => {
  const mappedCollection = servers.map(({ path, server }) => ({
    pathToMatch: pathToRegexp(path),
    server,
  }));

  return (input$: Observable<UpgradeEvent>) =>
    input$.pipe(
      map(event => event.payload),
      filter(isWebSocketUpgrade),
      mergeMap(({ request, socket, head }) => from(mappedCollection).pipe(
        filter(({ pathToMatch }) => pathToMatch.test(request.url!)),
        tap(({ server }) =>
          server.map(server => server.handleUpgrade(request, socket, head, (ws) =>
            server.emit(ServerEventType.CONNECTION, ws, request)
          ),
        )),
        mapTo(true),
        toArray(),
        filter(matchedResults => !matchedResults.includes(true)),
        tap(() => socket.destroy()),
      )),
      mergeMapTo(EMPTY),
    );
};
