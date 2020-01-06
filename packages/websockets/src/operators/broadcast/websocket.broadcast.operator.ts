import { Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { WebSocketClientConnection } from '../../server/websocket.server.interface';

export const broadcast =
  <Input>(client: WebSocketClientConnection, fn: (input: Input) => any) =>
    (input$: Observable<Input>): Observable<boolean> =>
      input$.pipe(
        map(fn),
        mergeMap(data => client.sendBroadcastResponse(data)),
      );
