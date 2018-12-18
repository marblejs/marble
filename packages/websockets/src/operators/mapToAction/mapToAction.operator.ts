import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { WebSocketEffectResponse } from '../../effects/ws-effects.interface';

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
  (fn: (input: Input, creator: ActionCreator<Payload>) => WebSocketEffectResponse) =>
  (input$: Observable<Input>): Observable<WebSocketEffectResponse> =>
    input$.pipe(
      map(input => fn(input, actionCreator())),
    );
