import * as WebSocket from 'ws';
import { EMPTY } from 'rxjs';
import { EventTransformer } from '../transformer/transformer.inteface';
import { WebSocketIncomingData } from '../websocket.interface';

export { WebSocket };

export const handleResponse =
  (server: WebSocket.Server, eventTransformer: EventTransformer<WebSocketIncomingData, any>) =>
  <T>(response: T) => {

    // @TODO
    server.clients.forEach(c => {

      // @TODO
      const encodedResponse = eventTransformer.encode(response);
      c.send(encodedResponse);
    });

    return EMPTY;
  };
