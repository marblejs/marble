import { Event } from '@marblejs/core';
import { WebSocketData } from '../websocket.interface';

export interface EventTransformer<U extends WebSocketData = WebSocketData> {
  decode: (incomingEvent: U) => Event;
  encode: (outgoingEvent: Event) => U;
}
