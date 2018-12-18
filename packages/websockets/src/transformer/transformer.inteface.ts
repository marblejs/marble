import { WebSocketIncomingData } from '../websocket.interface';

export interface EventTransformer<T extends WebSocketIncomingData, U> {
  decode: (incomingEvent: T) => U;
  encode: (outgoingEvent: U) => T;
}
