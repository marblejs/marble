import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketEvent } from '../../websocket.interface';

interface ActionCreator<Payload> {
  type: (type: string) => {
    payload: (payload: Payload) => {
      type: string,
      payload: Payload,
    },
  };
}

export const actionCreator = <Payload>(): ActionCreator<Payload> => {
  const type = (type: string) => ({ payload: payload(type) });
  const payload = (type: string) => (payload: any) => ({ type, payload });
  return { type };
};

export const mapToAction = <Input, Payload = any>
  (fn: (input: Input, creator: ActionCreator<Payload>) => WebSocketEvent) =>
  (input$: Observable<Input>): Observable<WebSocketEvent> =>
    input$.pipe(
      map(input => fn(input, actionCreator())),
    );
