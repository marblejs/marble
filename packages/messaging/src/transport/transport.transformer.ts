import { Event } from '@marblejs/core';
import { compose } from 'fp-ts/lib/function';
import { TransportMessageTransformer } from './transport.interface';

export const jsonTransformer: TransportMessageTransformer<Event> = {
  decode: event => JSON.parse(event.toString()),
  encode: event => compose(Buffer.from, JSON.stringify)(event),
};
