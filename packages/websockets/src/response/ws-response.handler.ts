import * as WebSocket from 'ws';
import { EMPTY, Observable } from 'rxjs';
import { EventTransformer } from '../transformer/transformer.inteface';
import { WebSocketIncomingData, WebSocketClient } from '../websocket.interface';

type ResponseHandler =
  (client: WebSocketClient, server: WebSocket.Server, eventTransformer: EventTransformer<WebSocketIncomingData, any>) =>
  <T>(response: T) => Observable<never>;

export const handleResponse: ResponseHandler = (client, server, eventTransformer) => (response) => {
  const encodedResponse = eventTransformer.encode(response);
  client.send(encodedResponse);
  return EMPTY;
};

export const handleBroadcastResponse: ResponseHandler = (client, server, eventTransformer) => <T>(response: T) => {
  server.clients.forEach(c => {
    const encodedResponse = eventTransformer.encode(response);
    c.send(encodedResponse);
  });
  return EMPTY;
};
