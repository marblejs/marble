import { Subject } from 'rxjs';
import { flow, identity } from 'fp-ts/lib/function';
import { pipe } from 'fp-ts/lib/pipeable';
import * as E from 'fp-ts/lib/Either';
import { Event } from '@marblejs/core';
import { TransportMessageTransformer, TransportMessage } from './transport.interface';

export type DecodeMessageConfig = { msgTransformer: TransportMessageTransformer; errorSubject: Subject<Error> };
export type DecodeMessage = (config: DecodeMessageConfig) => (msg: TransportMessage<Buffer>) => Event;

const UNKNOWN_EVENT = { type: 'UNKNOWN' };

export const jsonTransformer: TransportMessageTransformer = {
  decode: event => JSON.parse(event.toString()),
  encode: event => flow(JSON.stringify, Buffer.from)(event),
};

export const decodeMessage: DecodeMessage = ({ msgTransformer, errorSubject }) => msg =>
  pipe(
    E.tryCatch(
      () => msgTransformer.decode(msg.data),
      error => {
        errorSubject.next(error as Error);
        return UNKNOWN_EVENT;
      }),
    E.map(event => ({
      ...event,
      metadata: {
        replyTo: msg.replyTo,
        correlationId: msg.correlationId,
        raw: msg,
      },
    })),
    E.fold(identity, identity),
  );
