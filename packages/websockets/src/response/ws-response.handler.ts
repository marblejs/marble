import * as WebSocket from 'ws';
import { EMPTY } from 'rxjs';
import { WebSocketEffectResponse } from '../effects/ws-effects.interface';
import { EventTransformer } from '../transformer/transformer.inteface';
import { Socket } from '../websocket.interface';

export { WebSocket };

export const handleResponse =
  (socket: Socket, eventTransformer: EventTransformer) =>
  (response: WebSocketEffectResponse) => {

    // @TODO
    socket.server.clients.forEach(c => {

      // @TODO
      const encodedResponse = eventTransformer.encode(response);
      c.send(encodedResponse);
    });

    return EMPTY;
  };
