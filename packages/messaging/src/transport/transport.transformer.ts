import { Event } from '@marblejs/core';
import { flow } from 'fp-ts/lib/function';
import { TransportMessageTransformer } from './transport.interface';

export const jsonTransformer: TransportMessageTransformer<Event> = {
  decode: event => JSON.parse(event.toString()),
  encode: event => flow(JSON.stringify, Buffer.from)(event),
};
