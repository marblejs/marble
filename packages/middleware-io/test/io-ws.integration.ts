import { webSocketListener, WebSocketEffect, matchType } from '@marblejs/websockets';
import { map } from 'rxjs/operators';
import { eventValidator$, io } from '../src';

const user = io.type({
  id: io.string,
  age: io.number,
});

const userValidator$ = eventValidator$(io.type({
  payload: user,
}));

const postUser$: WebSocketEffect = event$ =>
  userValidator$(event$.pipe(
    matchType('POST_USER')
  )).pipe(
    // some computation ...
    map(event => event),
  );
export const app = webSocketListener({
  effects: [postUser$],
});
