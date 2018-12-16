import * as WebSocket from 'ws';
import { Observable } from 'rxjs';
import { WebSocketEffectResponse } from './effects/ws-effects.interface';

export type WebSocketType = string;

export type WebSocketClient = WebSocket;

export interface ExtendedWebSocketClient extends WebSocketClient {
  sendResponse: (response: WebSocketEffectResponse) => Observable<never>;
}

export interface WebSocketEvent<T = unknown> extends Record<string, any> {
  data: T;
  type: WebSocketType;
}

export interface Socket<
  Event = any,
  Client extends WebSocketClient = WebSocketClient
> {
  server: WebSocket.Server;
  client: Client;
  event: Event;
}
