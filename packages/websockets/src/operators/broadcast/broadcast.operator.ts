import { Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { MarbleWebSocketClient } from '../../websocket.interface';

export const broadcast = <Input>
  (client: MarbleWebSocketClient, fn: (input: Input) => any) =>
  (input$: Observable<Input>): Observable<never> =>
    input$.pipe(
      map(fn),
      mergeMap(data => client.sendBroadcastResponse(data)),
    );
