import * as WebSocket from 'ws';
import { ExtendedWebSocketClient, WebSocketClient } from './websocket.interface';

type ExtendableFields = {
  isAlive: boolean;
  sendResponse: Function;
};

export const extendClientWith = (extendableFields: ExtendableFields) => (client: WebSocket) => {
  const extendedClient = client as ExtendedWebSocketClient;

  Object
    .entries(extendableFields)
    .forEach(([key, value]) => extendedClient[key] = value);

  return extendedClient;
};

export const handleBrokenConnections = (heartbeatInterval: number) => (server: WebSocket.Server) => {
  setInterval(() => {
    server.clients.forEach((client: WebSocketClient) => {
      const extendedClient = client as ExtendedWebSocketClient;

      if (extendedClient.isAlive === false) { return client.terminate(); }

      extendedClient.isAlive = false;
      extendedClient.ping(() => null);
    });
  }, heartbeatInterval);

  return server;
};
