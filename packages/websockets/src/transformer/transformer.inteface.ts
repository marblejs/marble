import { WebSocketData } from '../websocket.interface';

export interface EventTransformer<T, U extends WebSocketData = WebSocketData> {
  decode: (incomingEvent: U) => T;
  encode: (outgoingEvent: T) => U;
}
