import { Observable } from 'rxjs';
import { mapTo, map } from 'rxjs/operators';
import * as t from 'io-ts';
import { Marbles } from '../../+internal/testing';
import { event } from '../../event/event';
import { Event } from '../../event/event.interface';
import { ServerEventType, ServerEvent, AllServerEvents, } from '../../http/server/http.server.event';
import { matchEvent } from './matchEvent.operator';

describe('#matchEvent operator', () => {
  test('matches string Event', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const outgoingEvent: Event = { type: 'TEST_EVENT_RESULT', payload: 100 };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        matchEvent('TEST_EVENT_3', 'TEST_EVENT_2'),
        mapTo(outgoingEvent),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2, c: event3, d: event4 }],
      ['---b-c-----', { b: outgoingEvent, c: outgoingEvent }],
    ]);
  });

  test('matches object Event', () => {
    // given
    const event1: Event = { type: 'TEST_EVENT_1', payload: 1 };
    const event2: Event = { type: 'TEST_EVENT_2', payload: 2 };
    const event3: Event = { type: 'TEST_EVENT_3', payload: 3 };
    const event4: Event = { type: 'TEST_EVENT_4', payload: 4 };
    const outgoingEvent: Event = { type: 'TEST_EVENT_RESULT', payload: 100 };

    // when
    const effect$ = (event$: Observable<Event>) =>
      event$.pipe(
        matchEvent({ type: 'TEST_EVENT_3' }, { type: 'TEST_EVENT_2' }),
        mapTo(outgoingEvent),
      );

    // then
    Marbles.assertEffect(effect$, [
      ['-a-b-c-d---', { a: event1, b: event2, c: event3, d: event4 }],
      ['---b-c-----', { b: outgoingEvent, c: outgoingEvent }],
    ]);
  });

  test('matches EventCreator', () => {
    // given
    const listenEvent: Event = { type: ServerEventType.LISTENING, payload: { port: 80, host: 'localhost' } };
    const closeEvent: Event = { type: ServerEventType.CLOSE, payload: {} };
    const errorEvent: Event = { type: ServerEventType.ERROR, payload: {} };

    // when
    const listen$ = (event$: Observable<AllServerEvents>) =>
      event$.pipe(
        matchEvent(ServerEvent.listening),
        map(event => event.payload),
      );

    // then
    Marbles.assertEffect(listen$, [
      ['-a-b-c---', { a: closeEvent, b: listenEvent, c: errorEvent }],
      ['---b-----', { b: listenEvent.payload }],
    ]);
  });

  test('matches EventCreator collection', () => {
    // given
    const listenEvent: Event = { type: ServerEventType.LISTENING, payload: { port: 80, host: 'localhost' } };
    const closeEvent: Event = { type: ServerEventType.CLOSE, payload: {} };
    const errorEvent: Event = { type: ServerEventType.ERROR, payload: {} };

    // when
    const listen$ = (event$: Observable<AllServerEvents>) =>
      event$.pipe(
        matchEvent(ServerEvent.listening, ServerEvent.error),
        map(event => event.payload),
      );

    // then
    Marbles.assertEffect(listen$, [
      ['-a-b-c---', { a: closeEvent, b: listenEvent, c: errorEvent }],
      ['---b-c---', { b: listenEvent.payload, c: errorEvent.payload }],
    ]);
  });

  test('matches EventSchema', () => {
    // given
    const FooEvent = event('FOO')();
    const BarEvent = event('BAR')();
    const BazEvent = event('BAZ')(t.type({
      test1: t.number,
      test2: t.string,
    }));

    const fooEvent = FooEvent.create();
    const barEvent = BarEvent.create();
    const bazEvent = BazEvent.create({ test1: 100, test2: '100' });

    const EventUnion = t.union([FooEvent, BarEvent, BazEvent]);
    type EventUnion = t.TypeOf<typeof EventUnion>

    // when
    const listen$ = (event$: Observable<EventUnion>) =>
      event$.pipe(
        matchEvent(BazEvent),
        map(event => event.payload),
      );

    // then
    Marbles.assertEffect(listen$, [
      ['-a-b-c---', { a: fooEvent, b: barEvent, c: bazEvent }],
      ['-----c---', { c: bazEvent.payload }],
    ]);
  });

  test('matches EventSchema collection', () => {
    // given
    const FooEvent = event('FOO')();
    const BarEvent = event('BAR')();
    const BazEvent = event('BAZ')(t.type({
      test1: t.number,
      test2: t.string,
    }));

    const fooEvent = FooEvent.create();
    const barEvent = BarEvent.create();
    const bazEvent = BazEvent.create({ test1: 100, test2: '100' });

    // when
    const listen$ = (event$: Observable<Event>) =>
      event$.pipe(
        matchEvent(FooEvent, BarEvent),
        map(event => event.payload),
      );

    // then
    Marbles.assertEffect(listen$, [
      ['-a-b-c---', { a: fooEvent, b: barEvent, c: bazEvent }],
      ['-a-b-----', { a: undefined, b: undefined }],
    ]);
  });
});
