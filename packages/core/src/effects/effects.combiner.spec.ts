import { firstValueFrom, of } from 'rxjs';
import { tap, mapTo, filter } from 'rxjs/operators';
import { Marbles } from '../+internal/testing';
import { Event } from '../event/event.interface';
import { combineMiddlewares, combineEffects } from './effects.combiner';
import { Effect, EffectContext } from './effects.interface';

type EventEffect = Effect<Event<number>, Event<number>, any>;

describe('#combineMiddlewares', () => {
  test('combines middlewares into one stream', async () => {
    // given
    const a$: EventEffect = event$ => event$.pipe(tap(event => { event.payload = 1; }));
    const b$: EventEffect = event$ => event$.pipe(tap(event => { event.payload = (event.payload ?? 0) + 1; }));
    const c$: EventEffect = event$ => event$.pipe(tap(event => { event.payload = (event.payload ?? 0) + 1; }));
    const incomingEvent: Event<number> = { type: 'FOO', payload: 0 };
    const outgoingEvent: Event<number> = { type: 'FOO', payload: 3 };
    const ctx = {} as EffectContext<unknown>;

    // when
    const middlewares$ = combineMiddlewares(a$, b$, c$);
    const response = await firstValueFrom(middlewares$(of(incomingEvent), ctx));

    // then
    expect(response).toEqual(outgoingEvent);
  });

  test('returns stream even if middlewares are not provided', async () => {
    // given
    const incomingEvent: Event<number> = { type: 'FOO', payload: 0 };
    const outgoingEvent: Event<number> = { type: 'FOO', payload: 0 };
    const ctx = {} as EffectContext<unknown>;

    // when
    const middlewares$ = combineMiddlewares();

    // then
    const response = await firstValueFrom(middlewares$(of(incomingEvent), ctx));
    expect(response).toEqual(outgoingEvent);
  });
});

describe('#combineEffects', () => {
  test('combines effects into multiple streams', () => {
    // given
    const a$: EventEffect = event$ => event$.pipe(filter(event => event.type === 'FOO_1'), mapTo({ type: 'FOO_1_RESULT', payload: 1 }));
    const b$: EventEffect = event$ => event$.pipe(filter(event => event.type === 'FOO_2'), mapTo({ type: 'FOO_2_RESULT', payload: 2 }));
    const c$: EventEffect = event$ => event$.pipe(filter(event => event.type === 'FOO_3'), mapTo({ type: 'FOO_3_RESULT', payload: 3 }));
    const a: Event<number> = { type: 'FOO_1', payload: 0 };
    const b: Event<number> = { type: 'FOO_2', payload: 0 };
    const c: Event<number> = { type: 'FOO_3', payload: 0 };

    // when
    const effects$ = combineEffects(a$, b$, c$);

    // then
    Marbles.assertEffect(effects$, [
      ['-a--b--c---', { a, b, c }],
      ['-a--b--c---', {
        a: { type: 'FOO_1_RESULT', payload: 1 },
        b: { type: 'FOO_2_RESULT', payload: 2 },
        c: { type: 'FOO_3_RESULT', payload: 3 },
      }],
    ]);
  });
});
