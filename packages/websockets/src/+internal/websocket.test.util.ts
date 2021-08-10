import * as http from 'http';
import * as net from 'net';
import * as WebSocket from 'ws';
import { ServerConfig } from '@marblejs/core';
import { WebSocketClientConnection, WebSocketServerConnection, WebSocketServerConfig } from '../server/websocket.server.interface';
import { createWebSocketServer } from '../server/websocket.server';
import { WsServerEffect } from '../effects/websocket.effects.interface';

export const bootstrapHttpServer = async (host?: string, port?: number): Promise<http.Server> =>
  new Promise(resolve => {
    const httpServer = http.createServer();
    httpServer.listen(port, host, () => resolve(httpServer));
  });

export const bootstrapWebSocketClient = (httpServer: http.Server): Promise<WebSocket> => {
  const serverAddressInfo = httpServer.address() as net.AddressInfo;
  const host = serverAddressInfo.address === '::' ? '127.0.0.1' : serverAddressInfo.address;
  const port = serverAddressInfo.port;
  const client = new WebSocket(`ws://${host}:${port}`);
  return new Promise(resolve => client.once('open', () => resolve(client)));
};

export const bootstrapWebSocketServer = async (
  options:  WebSocketServerConfig['options'],
  listener: ServerConfig<any, any>['listener'],
  event$?: WsServerEffect,
  dependencies?: WebSocketServerConfig['dependencies'],
) => (await createWebSocketServer({ options, listener, event$, dependencies }))();

export const createWebSocketClientMock = (): WebSocketClientConnection => {
  class WebSocketClientMock extends WebSocket.EventEmitter {
    isAlive = false;
    ping = jest.fn();
    close = jest.fn();
    terminate = jest.fn();
  }

  return new WebSocketClientMock() as any;
};

export const createWebSocketServerMock = (clients: ReturnType<typeof createWebSocketClientMock>[]): WebSocketServerConnection => {
  class WebSocketServerMock extends WebSocket.EventEmitter {
    constructor(public clients: ReturnType<typeof createWebSocketClientMock>[]) {
      super();
    }
  }

  return new WebSocketServerMock(clients) as any;
};
