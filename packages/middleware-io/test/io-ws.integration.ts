import { use, matchEvent } from '@marblejs/core';
import { webSocketListener, WsEffect } from '@marblejs/websockets';
import { map } from 'rxjs/operators';
import { eventValidator$, t } from '../src';

const user = t.type({
  id: t.string,
  age: t.number,
});

const postUser$: WsEffect = event$ =>
  event$.pipe(
    matchEvent('POST_USER'),
    use(eventValidator$(user)),
    map(event => event),
  );

export const app = webSocketListener({
  effects: [postUser$],
});
