import { Observable, of, concat, throwError } from 'rxjs';
import { filter, tap, mergeMap } from 'rxjs/operators';
import { Event } from '../../event/event.interface';
import { Marbles } from '../../+internal/testing';
import { NamedError } from '../../+internal/utils';
import { act } from './act.operator';

describe('#act operator', () => {
  test('emits output event from async (Observable) call function', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(event => of(event)),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2, c: event3, d: event4 }],
      ['-a-b-c-d---', { a: event1, b: event2, c: event3, d: event4 }],
    ]);
  });

  test('emits multiple output events', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act((event: any) => of(event).pipe(
          mergeMap(e => e.payload === 2
            ? concat(of(e), of(e))
            : of(e)),
        )),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b----c-d---', { a: event1, b: event2, c: event3, d: event4 }],
      ['-a-(bb)-c-d---', { a: event1, b: event2, c: event3, d: event4 }],
    ]);
  });

  test('emits filtered output event', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act((event: any) => of(event).pipe(
          filter(e => e.payload >= 2),
        )),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2, c: event3, d: event4 }],
      ['---b-c-d---', {            b: event2, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event => maps to default => continues stream', () => {
    // given
    const error = { name: 'TestError', message: 'TestErrorMessage' };
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1, metadata: { replyTo: 'channel_1' } };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2, metadata: { replyTo: 'channel_2' } };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3, metadata: { replyTo: 'channel_3' } };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4, metadata: { replyTo: 'channel_4' } };
    const event_error: Event = { type: 'TEST_EVENT_2_UNHANDLED_ERROR', error, metadata: { replyTo: 'channel_2' } };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act((event: any) => of(event).pipe(
          tap(e => { if (e.payload === 2) throw new NamedError(error.name, error.message) }),
        )),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2,      c: event3, d: event4 }],
      ['-a-b-c-d---', { a: event1, b: event_error, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event => maps to custom event => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const event_error: Event = { type: 'TEST_ERROR', error: 'something went wrong' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(
          (event: any) => of(event).pipe(
            tap(e => { if (e.payload === 2) throw new Error('something went wrong') }),
          ),
          (error: Error) => ({
            type: 'TEST_ERROR',
            error: error.message,
          }),
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2,      c: event3, d: event4 }],
      ['-a-b-c-d---', { a: event1, b: event_error, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event => maps to custom event (based on errored one) => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const event_error: Event = { type: 'TEST_EVENT_2', error: 'something went wrong' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(
          (event: any) => of(event).pipe(
            tap(e => { if (e.payload === 2) throw new Error('something went wrong') }),
          ),
          (error: Error, event: Event) => ({
            type: event.type,
            error: error.message,
          }),
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2,      c: event3, d: event4 }],
      ['-a-b-c-d---', { a: event1, b: event_error, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event => maps to observable of new events => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const event_error: Event = { type: 'TEST_ERROR' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(
          (event: any) => of(event).pipe(
            tap(e => { if (e.payload === 2) throw new Error('something went wrong') }),
          ),
          () => concat(
            of(event_error),
            of(event_error),
          ),
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b----c-d---', { a: event1, b: event2,                          c: event3, d: event4 }],
      ['-a-(bb)-c-d---', { a: event1, b: { ...event_error, error: true }, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event when thrown outside stream => maps to observable of new events => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const event_error: Event = { type: 'TEST_ERROR' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(
          (event: Event) => {
            if (event.payload === 2) throw new Error('something went wrong');
            else return of(event);
          },
          () => concat(
            of(event_error),
            of(event_error),
          ),
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b----c-d---', { a: event1, b: event2,                          c: event3, d: event4 }],
      ['-a-(bb)-c-d---', { a: event1, b: { ...event_error, error: true }, c: event3, d: event4 }],
    ]);
  });

  test('passes through errored event', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', error: 'some_error' };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };

    const event_ok: Event = { type: 'TEST_EVENT_PROCESSED', payload: 0 };
    const event_err: Event = { type: 'TEST_EVENT_2_UNHANDLED_ERROR', error: 'some_error' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(_ => of(event_ok)),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1,   b: event2,    c: event3,   d: event4 }],
      ['-a-b-c-d---', { a: event_ok, b: event_err, c: event_ok, d: event_ok }],
    ]);
  });

  test('chains "act" operators', () => {
    // given
    const event1: Event<number> = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event<number, string> = { type: 'TEST_EVENT_2', error: 'some_error' };
    const event3: Event<number> = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event<number> = { type: 'TEST_EVENT_4', payload: 4 };

    const event_ok: Event<boolean> = { type: 'TEST_EVENT_PROCESSED', payload: true };
    const event_ok_out: Event<number> = { type: 'TEST_EVENT_PROCESSED', payload: 0 };

    const event_err1: Event<string> = { type: 'TEST_EVENT_ERROR', payload: 'test_1' };
    const event_err2: Event<string> = { type: 'TEST_EVENT_ERROR', payload: 'test_2' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(_ => of(event_ok),     _ => event_err1),
        act(_ => of(event_ok_out), _ => event_err2),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1,       b: event2,                         c: event3,       d: event4 }],
      ['-a-b-c-d---', { a: event_ok_out, b: { ...event_err2, error: true }, c: event_ok_out, d: event_ok_out }],
    ]);
  });

  test('triggers subsequent "act" error handler if previous "act" operator did not handled the exception', () => {
    // given
    const event1: Event<number> = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event<number> = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event<number> = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event<number> = { type: 'TEST_EVENT_4', payload: 4 };

    const event_ok: Event<boolean> = { type: 'TEST_EVENT_PROCESSED', payload: true };
    const event_err: Event<string> = { type: 'TEST_EVENT_ERROR', payload: 'test_error' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(e => e.payload === 2 ? throwError(() => 'test_error') : of(e as Event<number>)),
        act(_ => of(event_ok), (error, event) => {
          expect(error).toEqual('test_error');
          expect(event).toEqual({ type: 'TEST_EVENT_2_UNHANDLED_ERROR', error: 'test_error' });
          return event_err;
        }),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1,   b: event2,                        c: event3,   d: event4 }],
      ['-a-b-c-d---', { a: event_ok, b: { ...event_err, error: true }, c: event_ok, d: event_ok }],
    ]);
  });
});
