import { use } from '@marblejs/core';
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
  event$.pipe(
    matchType('POST_USER'),
    use(userValidator$),
    map(event => event),
  );
export const app = webSocketListener({
  effects: [postUser$],
});
