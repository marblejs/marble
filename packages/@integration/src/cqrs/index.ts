import { IO } from 'fp-ts/lib/IO';
import { isTestEnv, getPortEnv } from '@marblejs/core/dist/+internal/utils';
import { httpListener, createServer, bindEagerlyTo } from '@marblejs/core';
import { messagingListener, EventBusClientToken, eventBusClient, EventBusToken, eventBus } from '@marblejs/messaging';
import { bodyParser$ } from '@marblejs/middleware-body';
import { logger$ } from '@marblejs/middleware-logger';
import { postDocumentsGenerate$ } from './effects/http.effects';
import { generateOfferDocument$, saveOfferDocument$ } from './effects/eventbus.effects';

const messagingListenerReader = messagingListener({
  effects: [
    generateOfferDocument$,
    saveOfferDocument$,
  ],
});

const httpListenerReader = httpListener({
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
  httpListener: httpListenerReader,
  dependencies: [
    bindEagerlyTo(EventBusClientToken)(eventBusClient),
    bindEagerlyTo(EventBusToken)(eventBus({ messagingListener: messagingListenerReader })),
  ],
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
