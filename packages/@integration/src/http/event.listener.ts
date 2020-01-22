import { map } from 'rxjs/operators';
import { matchEvent } from '@marblejs/core';
import { messagingListener, MsgEffect } from '@marblejs/messaging';

const test$: MsgEffect = event$ =>
  event$.pipe(
    matchEvent('TEST'),
    map(event => ({ ...event, type: 'TEST_RESULT', payload: 'some_result' })),
  );

export default messagingListener({
  effects: [test$],
});
