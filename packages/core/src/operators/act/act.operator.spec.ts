import { Observable, of, concat } from 'rxjs';
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
    const eventErrored: Event = { type: 'TEST_EVENT_2', error, metadata: { replyTo: 'channel_2' } };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act((event: any) => of(event).pipe(
          tap(e => { if (e.payload === 2) throw new NamedError(error.name, error.message) }),
        )),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2,       c: event3, d: event4 }],
      ['-a-b-c-d---', { a: event1, b: eventErrored, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event => maps to custom event => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const eventErrored: Event = { type: 'TEST_ERROR', error: 'something went wrong' };

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
      ['-a-b-c-d---', { a: event1, b: event2,       c: event3, d: event4 }],
      ['-a-b-c-d---', { a: event1, b: eventErrored, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event => maps to custom event (based on errored one) => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const eventErrored: Event = { type: 'TEST_EVENT_2', error: 'something went wrong' };

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
      ['-a-b-c-d---', { a: event1, b: event2,       c: event3, d: event4 }],
      ['-a-b-c-d---', { a: event1, b: eventErrored, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event => maps to observable of new events => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const eventErrored: Event = { type: 'TEST_ERROR' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(
          (event: any) => of(event).pipe(
            tap(e => { if (e.payload === 2) throw new Error('something went wrong') }),
          ),
          () => concat(
            of(eventErrored),
            of(eventErrored),
          ),
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b----c-d---', { a: event1, b: event2,       c: event3, d: event4 }],
      ['-a-(bb)-c-d---', { a: event1, b: eventErrored, c: event3, d: event4 }],
    ]);
  });

  test('catches errored event when thrown outside stream => maps to observable of new events => continues stream', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const eventErrored: Event = { type: 'TEST_ERROR' };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        act(
          (event: Event) => {
            if (event.payload === 2) throw new Error('something went wrong');
            else return of(event);
          },
          () => concat(
            of(eventErrored),
            of(eventErrored),
          ),
        ),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b----c-d---', { a: event1, b: event2,       c: event3, d: event4 }],
      ['-a-(bb)-c-d---', { a: event1, b: eventErrored, c: event3, d: event4 }],
    ]);
  });
});
