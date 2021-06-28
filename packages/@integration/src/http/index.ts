import * as T from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { createServer, httpListener } from '@marblejs/http';
import { isTestEnv, getPortEnv } from '@marblejs/core/dist/+internal/utils';
import { logger$ } from '@marblejs/middleware-logger';
import { bodyParser$ } from '@marblejs/middleware-body';
import { api$ } from './effects/api.effects';
import { cors$ } from './middlewares/cors.middleware';

export const listener = httpListener({
  middlewares: [
    logger$({ silent: isTestEnv() }),
    bodyParser$(),
    cors$,
  ],
  effects: [
    api$,
  ],
});

export const server = () => createServer({
  port: getPortEnv(),
  listener,
});

export const main = !isTestEnv()
  ? pipe(server, T.map(run => run()))
  : T.of(undefined);

main();
