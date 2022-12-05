import { Socket } from 'net';
import { IncomingMessage } from 'http';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { EventMetadata } from '@marblejs/core';
import { pathToRegexp } from 'path-to-regexp';
import { Observable, from, EMPTY } from 'rxjs';
import { filter, mergeMap, map, tap, toArray } from 'rxjs/operators';
import { WebSocketServerConnection } from '../../server/websocket.server.interface';

export type UpgradeEvent = {
  type: 'upgrade';
  payload: {
      request: IncomingMessage;
      socket: Socket;
      head: Buffer;
  };
  metadata?: EventMetadata;
}

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
            server.emit('connection', ws, request)
          ))),
        ),
        map(() => true),
        toArray(),
        filter(matchedResults => !matchedResults.includes(true)),
        tap(() => socket.destroy()),
      )),
      mergeMap(() => EMPTY),
    );
};
