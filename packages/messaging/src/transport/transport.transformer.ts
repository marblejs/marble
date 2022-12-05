import { Subject } from 'rxjs';
import { flow, identity, pipe } from 'fp-ts/lib/function';
import * as E from 'fp-ts/lib/Either';
import { Event } from '@marblejs/core';
import { TransportMessageTransformer, TransportMessage } from './transport.interface';

export type DecodeMessageConfig = { msgTransformer: TransportMessageTransformer; errorSubject: Subject<Error> };
export type DecodeMessage = (config: DecodeMessageConfig) => (msg: TransportMessage<Buffer>) => Event;

export const jsonTransformer: TransportMessageTransformer = {
  decode: event => JSON.parse(event.toString()),
  encode: event => flow(JSON.stringify, Buffer.from)(event),
};

const applyMetadata = (raw: TransportMessage<Buffer>) => (event: Event) => ({
  ...event,
  metadata: {
    replyTo: raw.replyTo,
    correlationId: raw.correlationId,
    raw,
  },
});

export const decodeMessage: DecodeMessage = ({ msgTransformer, errorSubject }) => msg =>
  pipe(
    E.tryCatch(
      () => msgTransformer.decode(msg.data),
      error => {
        errorSubject.next(error as Error);
        return applyMetadata(msg)({ type: 'UNKNOWN' });
      }),
    E.map(applyMetadata(msg)),
    E.fold(identity, identity),
  );
