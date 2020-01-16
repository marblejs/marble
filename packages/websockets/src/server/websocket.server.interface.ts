import * as WebSocket from 'ws';
import { Observable } from 'rxjs';
import { BoundDependency, Event } from '@marblejs/core';
import { WsConnectionEffect } from '../effects/websocket.effects.interface';
import { webSocketListener } from './websocket.server.listener';

export interface WebSocketServerConfig {
  options?: WebSocket.ServerOptions;
  webSocketListener: ReturnType<typeof webSocketListener>;
  dependencies?: BoundDependency<any>[];
  connection$?: WsConnectionEffect;
}

export interface WebSocketServerConnection extends WebSocket.Server {
  sendBroadcastResponse: <T extends Event>(response: T) => Observable<boolean>;
}

export interface WebSocketClientConnection extends WebSocket {
  id: string;
  address: string;
  isAlive: boolean;
  sendResponse: <T extends Event>(response: T) => Observable<boolean>;
  sendBroadcastResponse: <T extends Event>(response: T) => Observable<boolean>;
}
