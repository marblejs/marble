import { matchEvent, act } from '@marblejs/core';
import { webSocketListener, WsEffect } from '@marblejs/websockets';
import { validateEvent, t } from '../src';

const userSchema = t.type({
  id: t.string,
  age: t.number,
});

const postUser$: WsEffect = event$ =>
  event$.pipe(
    matchEvent('POST_USER'),
    act(validateEvent(userSchema)),
  );

export const listener = webSocketListener({
  effects: [postUser$],
});
