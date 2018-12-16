import { Socket, WebSocketEvent } from '../websocket.interface';

export const socketJsonParser = (socket: Socket): Socket<WebSocketEvent> => ({
  ...socket,
  event: JSON.parse(socket.event),
});
