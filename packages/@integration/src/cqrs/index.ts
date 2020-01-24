import { IO } from 'fp-ts/lib/IO';
import { isTestEnv, getPortEnv } from '@marblejs/core/dist/+internal/utils';
import { httpListener, createServer, bindEagerlyTo } from '@marblejs/core';
import { messagingListener, EventBusClientToken, eventBusClient, EventBusToken, eventBus } from '@marblejs/messaging';
import { bodyParser$ } from '@marblejs/middleware-body';
import { logger$ } from '@marblejs/middleware-logger';
import { postDocumentsGenerate$ } from './effects/http.effects';
import { generateOfferDocument$, saveOfferDocument$ } from './effects/eventbus.effects';

const eventBusListener = messagingListener({
  effects: [
    generateOfferDocument$,
    saveOfferDocument$,
  ],
});

const listener = httpListener({
  middlewares: [
    logger$({ silent: isTestEnv() }),
    bodyParser$(),
  ],
  effects: [
    postDocumentsGenerate$,
  ],
});

export const server = createServer({
  port: getPortEnv(),
  listener,
  dependencies: [
    bindEagerlyTo(EventBusClientToken)(eventBusClient),
    bindEagerlyTo(EventBusToken)(eventBus({ listener: eventBusListener })),
  ],
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
