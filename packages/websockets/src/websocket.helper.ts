import * as WebSocket from 'ws';
import { EMPTY, Observable } from 'rxjs';
import {
  MarbleWebSocketClient,
  MarbleWebSocketServer,
  WebSocketClient,
  WebSocketStatus,
  WebSocketServer,
  WebSocketIncomingData,
} from './websocket.interface';
import { WebSocketConnectionError } from './error/ws-error.model';
export { WebSocket };

type ExtendableServerFields = {
  sendBroadcastResponse: MarbleWebSocketServer['sendBroadcastResponse'];
};

type ExtendableClientFields = {
  isAlive: boolean;
  sendResponse: MarbleWebSocketClient['sendResponse'];
  sendBroadcastResponse: MarbleWebSocketClient['sendBroadcastResponse'];
};

const HEART_BEAT_INTERVAL = 10 * 1000;

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
  client.close(error.status || WebSocketStatus.INTERNAL_ERROR, error.message);
  return EMPTY;
};

export const fromWebSocketEvent =  (client: MarbleWebSocketClient, event: string) =>
  new Observable<WebSocketIncomingData>(subscriber => {
    client.on(event, message => subscriber.next(message));
  });
