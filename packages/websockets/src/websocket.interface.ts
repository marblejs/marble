import * as WebSocket from 'ws';
import { Observable } from 'rxjs';
import { WebSocketEffectResponse } from './effects/ws-effects.interface';

export type WebSocketType = string;

export type WebSocketClient = WebSocket;

export interface ExtendedWebSocketClient extends WebSocketClient {
  isAlive: boolean;
  sendResponse: (response: WebSocketEffectResponse) => Observable<never>;
}

export interface WebSocketEvent<T = unknown> extends Record<string, any> {
  payload: T;
  type: WebSocketType;
}
