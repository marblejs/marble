import { Observable } from 'rxjs';
import { mergeMap, map, mapTo } from 'rxjs/operators';
import { WebSocketClientConnection } from '../../server/websocket.server.interface';

export const broadcast =
  <Input, T>(client: WebSocketClientConnection, fn: (input: Input) => T) =>
    (input$: Observable<Input>): Observable<T> =>
      input$.pipe(
        map(fn),
        mergeMap(data => client.sendBroadcastResponse(data).pipe(
          mapTo(data),
        )),
      );
