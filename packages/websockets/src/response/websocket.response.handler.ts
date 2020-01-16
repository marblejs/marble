import * as WebSocket from 'ws';
import { Observable, of } from 'rxjs';
import { Event } from '@marblejs/core';
import { EventTransformer } from '../transformer/websocket.transformer.interface';

type ClientResponseHandler =
  (client: WebSocket, eventTransformer: EventTransformer<any>) =>
  <T extends Event>(response: T) => Observable<boolean>;

type ServerResponseHandler =
  (server: WebSocket.Server, eventTransformer: EventTransformer<any>) =>
  <T extends Event>(response: T) => Observable<boolean>;

export const handleResponse: ClientResponseHandler = (client, eventTransformer) => <T extends Event>(response: T) => {
  const encodedResponse = eventTransformer.encode(response);
  client.send(encodedResponse);
  return of(true);
};

export const handleBroadcastResponse: ServerResponseHandler = (server, eventTransformer) => <T extends Event>(response: T) => {
  server.clients.forEach(c => {
    const encodedResponse = eventTransformer.encode(response);
    c.send(encodedResponse);
  });
  return of(true);
};
