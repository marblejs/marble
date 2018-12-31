import * as WebSocket from 'ws';
import { EMPTY, Observable } from 'rxjs';
import { EventTransformer } from '../transformer/transformer.inteface';
import { WebSocketClient } from '../websocket.interface';

type ClientResponseHandler =
  (client: WebSocketClient, eventTransformer: EventTransformer<any>) =>
  <T>(response: T) => Observable<never>;

type ServerResponseHandler =
  (server: WebSocket.Server, eventTransformer: EventTransformer<any>) =>
  <T>(response: T) => Observable<never>;

export const handleResponse: ClientResponseHandler = (client, eventTransformer) => (response) => {
  const encodedResponse = eventTransformer.encode(response);
  client.send(encodedResponse);
  return EMPTY;
};

export const handleBroadcastResponse: ServerResponseHandler = (server, eventTransformer) => <T>(response: T) => {
  server.clients.forEach(c => {
    const encodedResponse = eventTransformer.encode(response);
    c.send(encodedResponse);
  });
  return EMPTY;
};
