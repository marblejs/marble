import * as E from 'fp-ts/lib/Either';
import { pipe } from 'fp-ts/lib/pipeable';
import { identity } from 'fp-ts/lib/function';
import { Subject } from 'rxjs';
import { takeWhile, takeUntil, take } from 'rxjs/operators';
import { bindTo, createEffectContext, combineEffects, ServerIO, lookup, logContext, LoggerTag, contextFactory } from '@marblejs/core';
import { throwException } from '@marblejs/core/dist/+internal/utils';
import { provideTransportLayer } from '../transport/transport.provider';
import { statusLogger$ } from '../middlewares/messaging.statusLogger.middleware';
import { TransportLayerConnection } from '../transport/transport.interface';
import { EventTimerStoreToken, EventTimerStore } from '../eventStore/eventTimerStore';
import { CreateMicroserviceConfig } from './messaging.server.interface';
import { TransportLayerToken, ServerEventsToken } from './messaging.server.tokens';
import { AllServerEvents, isCloseEvent, ServerEvent } from './messaging.server.events';

export const createMicroservice = async (config: CreateMicroserviceConfig) => {
  const {
    event$,
    options,
    transport,
    dependencies = [],
    listener,
  } = config;

  const transportLayer = pipe(
    provideTransportLayer(transport, options)(),
    E.fold(throwException, identity));

  const serverEventsSubject = new Subject<AllServerEvents>();
  const boundEventTimerStore = bindTo(EventTimerStoreToken)(EventTimerStore);
  const boundTransportLayer = bindTo(TransportLayerToken)(() => transportLayer);
  const boundServerEvents = bindTo(ServerEventsToken)(() => serverEventsSubject);

  const context = await contextFactory(
    boundEventTimerStore,
    boundTransportLayer,
    boundServerEvents,
    ...dependencies,
  );

  logContext(LoggerTag.MESSAGING)(context);

  const messagingListener = listener(context);
  const serverEvent$ = serverEventsSubject.asObservable().pipe(takeWhile(e => !isCloseEvent(e)));
  const ctx = createEffectContext({ ask: lookup(context), client: undefined });
  const combinedEvents = event$ ? combineEffects(statusLogger$, event$) : statusLogger$;

  combinedEvents(serverEvent$, ctx).subscribe();

  const listen: ServerIO<TransportLayerConnection> = async () => {
    const { host, channel } = transportLayer.config;
    const connection = await transportLayer.connect({ isConsumer: true });

    messagingListener(connection);

    connection.status$
      .pipe(takeUntil(connection.close$))
      .subscribe(type => serverEventsSubject.next(ServerEvent.status(host, channel, type)));

    connection.close$
      .pipe(take(1))
      .subscribe(() => serverEventsSubject.next(ServerEvent.close()));

    connection.error$
      .pipe(takeUntil(connection.close$))
      .subscribe(error => serverEventsSubject.next(ServerEvent.error(error)));

    return connection;
  };

  listen.context = context;

  return listen;
};
