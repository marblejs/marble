import * as WebSocket from 'ws';

export type WebSocketType = string;

export interface WebSocketClient extends WebSocket {}

export interface WebSocketEvent<T = unknown> extends Record<string, any> {
  data: T;
  type: WebSocketType;
}

export interface Socket<T = any> {
  client: WebSocketClient;
  server: WebSocket.Server;
  event: T;
}
