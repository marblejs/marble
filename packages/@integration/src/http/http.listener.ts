import { httpListener } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerDev$, loggerFile$ } from './middlewares/logger.middleware';
import { cors$ } from './middlewares/cors.middleware';
import { api$ } from './effects/api.effects';

export default httpListener({
  middlewares: [
    loggerDev$,
    loggerFile$,
    bodyParser$(),
    cors$,
  ],
  effects: [api$]
});
