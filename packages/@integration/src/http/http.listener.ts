import { httpListener } from '@marblejs/core';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';
import { bodyParser$ } from '@marblejs/middleware-body';
import { logger$ } from '@marblejs/middleware-logger';
import { cors$ } from './middlewares/cors.middleware';
import { api$ } from './effects/api.effects';

export default httpListener({
  middlewares: [
    logger$({ silent: isTestEnv() }),
    bodyParser$(),
    cors$,
  ],
  effects: [api$]
});
