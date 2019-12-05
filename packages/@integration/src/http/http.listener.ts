import { httpListener, HttpMiddlewareEffect } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { loggerDev$, loggerFile$ } from './middlewares/logger.middleware';
import { cors$ } from './middlewares/cors.middleware';
import { api$ } from './effects/api.effects';

const middleware$: HttpMiddlewareEffect = req$ => {
  console.log('test');
  return req$;
}

export default httpListener({
  middlewares: [
    loggerDev$,
    loggerFile$,
    bodyParser$(),
    middleware$,
    cors$,
  ],
  effects: [api$]
});
