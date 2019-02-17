import { createInjectionToken } from '@marblejs/core';
import { MarbleWebSocketServer } from '@marblejs/websockets';

export const WebSocketServerToken = createInjectionToken<MarbleWebSocketServer>();
