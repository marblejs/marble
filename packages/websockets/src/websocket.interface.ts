import * as WebSocket from 'ws';
import { Observable } from 'rxjs';

export type WebSocketType = string;

export type WebSocketClient = WebSocket;

export type WebSocketIncomingData = string | Buffer | ArrayBuffer | Buffer[];

export interface ExtendedWebSocketClient extends WebSocketClient {
  isAlive: boolean;
  sendResponse: <T>(response: T) => Observable<never>;
  sendBroadcastResponse: <T>(response: T) => Observable<never>;
}

export interface WebSocketEvent<T = unknown> extends Record<string, any> {
  payload: T;
  type: WebSocketType;
}
