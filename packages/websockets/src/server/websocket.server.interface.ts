import { BoundDependency, ListenerServer } from '@marblejs/core';
import { WebSocketServerOptions, MarbleWebSocketServer } from '../websocket.interface';
import { WsConnectionEffect } from '../effects/websocket.effects.interface';
import { webSocketListener } from './websocket.server.listener';

export interface WebSocketServerConfig {
  options?: WebSocketServerOptions;
  webSocketListener: ReturnType<typeof webSocketListener>;
  dependencies?: BoundDependency<any>[];
  connection$?: WsConnectionEffect;
}

export interface WebSocketServer extends ListenerServer<MarbleWebSocketServer> {}
