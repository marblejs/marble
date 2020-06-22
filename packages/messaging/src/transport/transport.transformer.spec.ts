import { ReplaySubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { TransportMessage } from './transport.interface';
import { jsonTransformer, decodeMessage } from './transport.transformer';

describe('#decodeMessage', () => {
  const errorSubject = new ReplaySubject<Error>(1);

  describe('#jsonTransformer', () => {
    const msgTransformer = jsonTransformer;

    test('decodes JSON message to Event with routing metadata', () => {
      // given
      const incomingEvent = { type: 'TEST', payload: { test: 'test' } };
      const message: TransportMessage<Buffer> = {
        data: msgTransformer.encode(incomingEvent),
        correlationId: createUuid(),
        replyTo: createUuid(),
      };

      // when
      const decodedEvent = decodeMessage({ errorSubject, msgTransformer })(message);

      // then
      expect(decodedEvent).toEqual({
        ...incomingEvent,
        metadata: {
          correlationId: message.correlationId,
          replyTo: message.replyTo,
          raw: message,
        },
      });
    });

    test('decodes JSON message to Event without routing metadata', () => {
      // given
      const incomingEvent = { type: 'TEST', payload: { test: 'test' } };
      const message: TransportMessage<Buffer> = {
        data: msgTransformer.encode(incomingEvent),
      };

      // when
      const decodedEvent = decodeMessage({ errorSubject, msgTransformer })(message);

      // then
      expect(decodedEvent).toEqual({
        ...incomingEvent,
        metadata: { raw: message },
      });
    });

    test('decodes invalid JSON message to unknown Event and emits error to given subject', done => {
      // given
      const message: TransportMessage<Buffer> = {
        data: Buffer.from('{ type }'),
      };

      // when
      const decodedEvent = decodeMessage({ errorSubject, msgTransformer })(message);

      // then
      expect(decodedEvent).toEqual({ type: 'UNKNOWN' });

      errorSubject
        .pipe(take(1))
        .subscribe(error => {
          expect(error).toBeDefined();
          done();
        });
    });
  });
});
