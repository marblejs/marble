import { Subject } from 'rxjs';
import { takeWhile, takeUntil, take } from 'rxjs/operators';
import { createContext, registerAll, bindTo, createEffectContext, lookup, combineEffects } from '@marblejs/core';
import { provideTransportLayer } from '../transport/transport.provider';
import { statusLogger$ } from '../middlewares/messaging.statusLogger.middleware';
import { CreateMicroserviceConfig, Microservice } from './messaging.server.interface';
import { TransportLayerToken, ServerEventsToken } from './messaging.server.tokens';
import { AllServerEvents, isCloseEvent, ServerEvent } from './messaging.server.events';

export const createMicroservice = (config: CreateMicroserviceConfig): Microservice => {
  const {
    event$,
    options,
    transport,
    dependencies = [],
    messagingListener,
  } = config;

  const serverEventsSubject = new Subject<AllServerEvents>();
  const transportLayer = provideTransportLayer(transport, options);
  const boundTransportLayer = bindTo(TransportLayerToken)(() => transportLayer);
  const boundServerEvents = bindTo(ServerEventsToken)(() => serverEventsSubject);
  const context = registerAll([ boundTransportLayer, boundServerEvents, ...dependencies ])(createContext());
  const listener = messagingListener(context);

  const serverEvent$ = serverEventsSubject.asObservable().pipe(takeWhile(e => !isCloseEvent(e)));
  const ctx = createEffectContext({ ask: lookup(context), client: undefined });
  const combinedEvents = event$ ? combineEffects(statusLogger$, event$) : statusLogger$;

  combinedEvents(serverEvent$, ctx).subscribe();

  const listen = async () => {
    const { host, channel } = transportLayer.config;
    const connection = await transportLayer.connect({ isConsumer: true });

    listener(connection);

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
