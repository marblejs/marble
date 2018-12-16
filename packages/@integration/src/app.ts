import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerDev$, loggerFile$ } from './middlewares/logger.middleware';
import { api$ } from './effects/api.effects';
import { webSocketListener } from '../../websockets/src/websocket.listener';

export const app = httpListener({
  middlewares: [
    loggerDev$,
    loggerFile$,
    bodyParser$,
  ],
  effects: [api$]
});

export const ws = webSocketListener({
  middlewares: [],
  effects: [],
});
