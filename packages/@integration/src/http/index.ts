import { IO } from 'fp-ts/lib/IO';
import { createServer, bindEagerlyTo } from '@marblejs/core';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';
import { EventBusToken, EventBusClientToken, eventBus, eventBusClient } from '@marblejs/messaging';
import httpListener from './http.listener';
import messagingListener from './event.listener';

const port = process.env.PORT
  ? Number(process.env.PORT)
  : undefined;

export const server = createServer({
  port,
  httpListener,
  dependencies: [
    bindEagerlyTo(EventBusClientToken)(eventBusClient),
    bindEagerlyTo(EventBusToken)(eventBus({ messagingListener })),
  ],
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
