import { IO } from 'fp-ts/lib/IO';
import { createServer, httpListener } from '@marblejs/core';
import { isTestEnv, getPortEnv } from '@marblejs/core/dist/+internal/utils';
import { logger$ } from '@marblejs/middleware-logger';
import { bodyParser$ } from '@marblejs/middleware-body';
import { api$ } from './effects/api.effects';
import { cors$ } from './middlewares/cors.middleware';

const httpListenerReader = httpListener({
  middlewares: [
    logger$({ silent: isTestEnv() }),
    bodyParser$(),
    cors$,
  ],
  effects: [
    api$,
  ],
});

export const server = createServer({
  port: getPortEnv(),
  httpListener: httpListenerReader,
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
