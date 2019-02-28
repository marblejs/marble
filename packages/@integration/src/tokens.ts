import { createContextToken } from '@marblejs/core';
import { MarbleWebSocketServer } from '@marblejs/websockets';

export const WsServerToken = createContextToken<MarbleWebSocketServer>();
