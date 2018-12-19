import * as WebSocket from 'ws';
import { ExtendedWebSocketClient, WebSocketClient } from './websocket.interface';

type ExtendableFields = {
  isAlive: boolean;
  sendResponse: ExtendedWebSocketClient['sendResponse'];
  sendBroadcastResponse: ExtendedWebSocketClient['sendBroadcastResponse'];
};

const HEART_BEAT_INTERVAL = 10 * 1000;

export const extendClientWith = (extendableFields: ExtendableFields) => (client: WebSocket) => {
  const extendedClient = client as ExtendedWebSocketClient;

  Object
    .entries(extendableFields)
    .forEach(([key, value]) => extendedClient[key] = value);

  return extendedClient;
};

export const handleServerBrokenConnections = (server: WebSocket.Server) => {
  setInterval(() => {
    server.clients.forEach((client: WebSocketClient) => {
      const extendedClient = client as ExtendedWebSocketClient;

      if (extendedClient.isAlive === false) { return client.terminate(); }

      extendedClient.isAlive = false;
      extendedClient.ping(() => null);
    });
  }, HEART_BEAT_INTERVAL);

  return server;
};

export const handleClientBrokenConnection = (client: ExtendedWebSocketClient) => {
  let pingTimeout;

  const heartbeat = (client: ExtendedWebSocketClient) => () => {
    client.isAlive = true;
    clearTimeout(pingTimeout);
    pingTimeout = setTimeout(() => client.terminate(), HEART_BEAT_INTERVAL + 1000);
  };

  client.on('open', heartbeat(client));
  client.on('ping', heartbeat(client));
  client.on('pong', heartbeat(client));
  client.on('close', () => clearTimeout(pingTimeout));

  return client;
};
