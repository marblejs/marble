import { Event, EventType, InjectorKey, InjectorGetter } from '@marblejs/core';
import * as pathToRegexp from 'path-to-regexp';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MarbleWebSocketServer } from '../../websocket.interface';

type UpgradeEventData = NonNullable<(typeof Event.UPGRADE)['data']>;

type WebSocketServerCollection = Array<{
  path: string,
  server: InjectorKey,
}>;

export const mapToServer = (...servers: WebSocketServerCollection) => (inject: InjectorGetter) => {
  const mappedCollection = servers.map(({ path, server: serverKey }) => ({
    pathToMatch: pathToRegexp(path),
    serverKey,
  }));

  return (input$: Observable<UpgradeEventData>): Observable<any> =>
    input$.pipe(
      tap(([ req, socket, head ]) => {
        let found = false;

        mappedCollection.forEach(({ pathToMatch, serverKey }) => {
          const pathname = req.url!;

          if (pathToMatch.test(pathname) && req.headers.upgrade === 'websocket') {
            const server = inject<MarbleWebSocketServer>(serverKey);

            if (server) {
              found = true;
              server.handleUpgrade(req, socket, head, function done(ws) {
                server.emit(EventType.CONNECTION, ws, req);
              });
            }
          }
        });

        if (!found) {
          socket.destroy();
        }
      }),
    );
};
