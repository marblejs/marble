import * as WebSocket from 'ws';
import { Observable } from 'rxjs';
import { Event, ServerConfig } from '@marblejs/core';
import { WsConnectionEffect, WsServerEffect } from '../effects/websocket.effects.interface';
import { webSocketListener } from './websocket.server.listener';

export const DEFAULT_HOSTNAME = '127.0.0.1';

type WebSocketListenerFn = ReturnType<typeof webSocketListener>;

export interface WebSocketServerConfig extends ServerConfig<WsServerEffect, WebSocketListenerFn> {
  /**
   * @deprecated: validate connection on `upgrade` or `connection` events instead
   */
  connection$?: WsConnectionEffect;
  options?: WebSocket.ServerOptions;
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
