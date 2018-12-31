import * as WebSocket from 'ws';
import { EMPTY } from 'rxjs';
import {
  MarbleWebSocketClient,
  MarbleWebSocketServer,
  WebSocketClient,
  WebSocketStatus,
  WebSocketServer,
} from '../websocket.interface';
import { WebSocketConnectionError } from '../error/ws-error.model';
export { WebSocket };

type ExtendableServerFields = {
  sendBroadcastResponse: MarbleWebSocketServer['sendBroadcastResponse'];
};

type ExtendableClientFields = {
  isAlive: boolean;
  sendResponse: MarbleWebSocketClient['sendResponse'];
  sendBroadcastResponse: MarbleWebSocketClient['sendBroadcastResponse'];
};

export const HEART_BEAT_INTERVAL = 10 * 1000;

export const createWebSocketServer = (options: WebSocket.ServerOptions) =>
  new WebSocket.Server(options);

export const extendServerWith = (extendableFields: ExtendableServerFields) => (server: WebSocketServer) => {
  const extendedServer = server as MarbleWebSocketServer;

  Object
    .entries(extendableFields)
    .forEach(([key, value]) => extendedServer[key] = value);

  return extendedServer;
};

export const extendClientWith = (extendableFields: ExtendableClientFields) => (client: WebSocketClient) => {
  const extendedClient = client as MarbleWebSocketClient;

  Object
    .entries(extendableFields)
    .forEach(([key, value]) => extendedClient[key] = value);

  return extendedClient;
};

export const handleServerBrokenConnections = (server: WebSocketServer) => {
  setInterval(() => {
    server.clients.forEach((client: WebSocketClient) => {
      const extendedClient = client as MarbleWebSocketClient;

      if (extendedClient.isAlive === false) { return client.terminate(); }

      extendedClient.isAlive = false;
      extendedClient.ping(() => null);
    });
  }, HEART_BEAT_INTERVAL);

  return server;
};

export const handleClientBrokenConnection = (client: MarbleWebSocketClient) => {
  let pingTimeout;

  const heartbeat = (client: MarbleWebSocketClient) => () => {
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

export const handleClientValidationError = (client: MarbleWebSocketClient) => (error: WebSocketConnectionError) => {
  client.isAlive = false;
  client.ping(() => null);
  client.close(error.status || WebSocketStatus.INTERNAL_ERROR, error.message);
  return EMPTY;
};
