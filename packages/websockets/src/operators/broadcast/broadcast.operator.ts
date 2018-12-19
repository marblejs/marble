import { Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { ExtendedWebSocketClient } from '../../websocket.interface';

export const broadcast = <Input>
  (client: ExtendedWebSocketClient) =>
  (fn: (input: Input) => any) =>
  (input$: Observable<Input>): Observable<never> =>
    input$.pipe(
      map(fn),
      mergeMap(client.sendBroadcastResponse),
    );
