import { use } from '@marblejs/core';
import { webSocketListener, WebSocketEffect, matchType } from '@marblejs/websockets';
import { map } from 'rxjs/operators';
import { eventValidator$, t } from '../src';

const user = t.type({
  id: t.string,
  age: t.number,
});

const postUser$: WebSocketEffect = event$ =>
  event$.pipe(
    matchType('POST_USER'),
    use(eventValidator$(user)),
    map(event => event),
  );

export const app = webSocketListener({
  effects: [postUser$],
});
