import * as T from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/pipeable';
import { isTestEnv, getPortEnv } from '@marblejs/core/dist/+internal/utils';
import { httpListener, createServer, bindEagerlyTo } from '@marblejs/core';
import { messagingListener, EventBusClientToken, eventBusClient, EventBusToken, eventBus } from '@marblejs/messaging';
import { bodyParser$ } from '@marblejs/middleware-body';
import { logger$ } from '@marblejs/middleware-logger';
import { postDocumentsGenerate$ } from './effects/http.effects';
import { generateOfferDocument$, offerDocumentCreated$ } from './effects/eventbus.effects';

const eventBusListener = messagingListener({
  effects: [
    generateOfferDocument$,
    offerDocumentCreated$,
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

export const server = () => createServer({
  port: getPortEnv(),
  listener,
  dependencies: [
    bindEagerlyTo(EventBusToken)(eventBus({ listener: eventBusListener })),
    bindEagerlyTo(EventBusClientToken)(eventBusClient),
  ],
});

export const main = !isTestEnv()
  ? pipe(server, T.map(run => run()))
  : T.of(undefined);

main();
