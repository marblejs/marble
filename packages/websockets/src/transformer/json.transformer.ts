import { EventTransformer } from './transformer.inteface';
import { WebSocketEvent } from '../websocket.interface';

export const jsonTransformer: EventTransformer<string, WebSocketEvent> = {
  decode: event => JSON.parse(event),
  encode: event => JSON.stringify(event),
};
