import { Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { Event } from '@marblejs/core';
import { WebSocketClientConnection } from '../../server/websocket.server.interface';

export const broadcast =
  <Input extends Event, T extends Event>(client: WebSocketClientConnection, fn: (input: Input) => T) =>
    (input$: Observable<Input>): Observable<T> =>
      input$.pipe(
        map(fn),
        mergeMap(data => client.sendBroadcastResponse(data).pipe(
          map(() => data),
        )),
      );
