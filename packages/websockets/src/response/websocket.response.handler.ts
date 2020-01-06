import * as WebSocket from 'ws';
import {  Observable, of } from 'rxjs';
import { EventTransformer } from '../transformer/websocket.transformer.interface';

type ClientResponseHandler =
  (client: WebSocket, eventTransformer: EventTransformer<any>) =>
  <T>(response: T) => Observable<boolean>;

type ServerResponseHandler =
  (server: WebSocket.Server, eventTransformer: EventTransformer<any>) =>
  <T>(response: T) => Observable<boolean>;

export const handleResponse: ClientResponseHandler = (client, eventTransformer) => <T>(response: T) => {
  const encodedResponse = eventTransformer.encode(response);
  client.send(encodedResponse);
  return of(true);
};

export const handleBroadcastResponse: ServerResponseHandler = (server, eventTransformer) => <T>(response: T) => {
  server.clients.forEach(c => {
    const encodedResponse = eventTransformer.encode(response);
    c.send(encodedResponse);
  });
  return of(true);
};
