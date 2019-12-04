import { createContext, registerAll, bindTo, createEffectContext, lookup, combineEffects } from '@marblejs/core';
import { Subject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { CreateMicroserviceConfig, Microservice } from './messaging.server.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { TransportLayerToken, ServerEventsToken } from './messaging.server.tokens';
import { AllServerEvents, isCloseEvent } from './messaging.server.events';
import { statusLogger$ } from '../middlewares/messaging.statusLogger.middleware';

export const createMicroservice = (config: CreateMicroserviceConfig): Microservice => {
  const {
    event$,
    options,
    transport,
    dependencies = [],
    messagingListener,
  } = config;

  const serverEventSubject = new Subject<AllServerEvents>();
  const transportLayer = provideTransportLayer(transport, options);
  const boundTransportLayer = bindTo(TransportLayerToken)(() => transportLayer);
  const boundServerEvents = bindTo(ServerEventsToken)(() => serverEventSubject);
  const context = registerAll([ boundTransportLayer, boundServerEvents, ...dependencies ])(createContext());
  const listenerWithContext = messagingListener(context);

  const serverEvent$ = serverEventSubject.asObservable().pipe(takeWhile(e => !isCloseEvent(e)));
  const ctx = createEffectContext({ ask: lookup(context), client: undefined });
  const combinedEvents = event$ ? combineEffects(statusLogger$, event$) : statusLogger$;

  combinedEvents(serverEvent$, ctx).subscribe();

  return listenerWithContext.listen;
};
