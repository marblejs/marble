import { WebSocketEvent } from '../websocket.interface';
import { WebSocketEffectResponse } from '../effects/ws-effects.interface';

export interface EventTransformer<T extends any = any> {
  decode: (incomingEvent: T) => WebSocketEvent;
  encode: (outgoingEvent: WebSocketEffectResponse) => T;
}
