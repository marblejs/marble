import * as WebSocket from 'ws';
import { EMPTY } from 'rxjs';
import { WebSocketEffectResponse } from '../effects/ws-effects.interface';
import { EventTransformer } from '../transformer/transformer.inteface';

export { WebSocket };

export const handleResponse =
  (server: WebSocket.Server, eventTransformer: EventTransformer) =>
  (response: WebSocketEffectResponse) => {

    // @TODO
    server.clients.forEach(c => {

      // @TODO
      const encodedResponse = eventTransformer.encode(response);
      c.send(encodedResponse);
    });

    return EMPTY;
  };
