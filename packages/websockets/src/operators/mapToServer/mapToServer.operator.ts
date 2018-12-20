import { Event, EventType } from '@marblejs/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { WebSocketServerCollection } from '../../websocket.interface';

type UpgradeEventData = NonNullable<(typeof Event.UPGRADE)['data']>;

export const mapToServer =
  (...servers: WebSocketServerCollection) =>
  (input$: Observable<UpgradeEventData>): Observable<any> =>
    input$.pipe(
      tap(([ req, socket, head ]) => {
        let found = false;

        servers.forEach(({ pathToMatch, server }) => {
          const pathname = req.url!;

          if (pathname.includes(pathToMatch)) {
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
