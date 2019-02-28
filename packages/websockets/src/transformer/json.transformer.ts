import { Event } from '@marblejs/core';
import { EventTransformer } from './transformer.inteface';

export const jsonTransformer: EventTransformer<Event, string> = {
  decode: event => JSON.parse(event),
  encode: event => JSON.stringify(event),
};
