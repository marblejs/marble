import { tap } from 'rxjs/operators';
import { Marbles } from '../../+internal/testing';
import { Event, EventType } from '../../http.interface';
import { ServerEffect } from '../../effects/effects.interface';
import { matchEvent } from './matchEvent.operator';

describe('#matchEvent', () => {
  test(`matches incoming '${EventType.LISTEN}' event`, () => {
    // given
    const listenEvent = { type: EventType.LISTEN, data: [80, 'localhost'] };
    const closeEvent = { type: EventType.CLOSE, data: [] };
    const errorEvent = { type: EventType.ERROR, data: [] };

    // when
    const listen$: ServerEffect = event$ =>
      event$.pipe(
        matchEvent(Event.LISTEN),
        tap(data => data[0] as number),
        tap(data => data[1] as string),
      );

    // then
    Marbles.assertEffect(listen$, [
      ['-a-b-c---', { a: closeEvent, b: listenEvent, c: errorEvent }],
      ['---b-----', { b: listenEvent.data }],
    ]);
  });
});
