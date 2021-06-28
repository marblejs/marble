import { act, matchEvent } from '@marblejs/core';
import { webSocketListener, WsEffect } from '@marblejs/websockets';
import { eventValidator$, t } from '../src';

const user = t.type({
  id: t.string,
  age: t.number,
});

const postUser$: WsEffect = event$ =>
  event$.pipe(
    matchEvent('POST_USER'),
    act(eventValidator$(user)),
  );

export const listener = webSocketListener({
  effects: [postUser$],
});
