import { createContextToken } from '@marblejs/core';
import { MarbleWebSocketServer } from '@marblejs/websockets';

export const WebSocketServerToken = createContextToken<MarbleWebSocketServer>();
