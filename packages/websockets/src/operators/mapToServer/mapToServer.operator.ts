import { Event, EventType } from '@marblejs/core';
import * as pathToRegexp from 'path-to-regexp';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebSocketServerCollection } from '../../websocket.interface';

type UpgradeEventData = NonNullable<(typeof Event.UPGRADE)['data']>;

export const mapToServer = (...servers: WebSocketServerCollection) => {
  const mappedCollection = servers.map(({ path, server }) => ({
    pathToMatch: pathToRegexp(path),
    server,
  }));

  return (input$: Observable<UpgradeEventData>): Observable<any> =>
    input$.pipe(
      tap(([ req, socket, head ]) => {
        let found = false;

        mappedCollection.forEach(({ pathToMatch, server }) => {
          const pathname = req.url!;

          if (pathToMatch.test(pathname)) {
            found = true;
            server.handleUpgrade(req, socket, head, function done(ws) {
              server.emit(EventType.CONNECTION, ws, req);
            });
          }
        });

        if (!found) {
          socket.destroy();
        }
      }),
    );
};
