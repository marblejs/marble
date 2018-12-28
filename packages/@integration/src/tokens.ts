import { createInjectionToken } from '@marblejs/core';
import { MarbleWebSocketServer } from '@marblejs/websockets';

export const WebSocketsToken = createInjectionToken<MarbleWebSocketServer>();
