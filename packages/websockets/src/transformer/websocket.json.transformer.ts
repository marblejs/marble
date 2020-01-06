import { Event } from '@marblejs/core';
import { EventTransformer } from './websocket.transformer.interface';

export const jsonTransformer: EventTransformer<Event, string> = {
  decode: event => JSON.parse(event),
  encode: event => JSON.stringify(event),
};
