import { createContext, registerAll, bindTo, createEffectMetadata, lookup } from '@marblejs/core';
import { Subject } from 'rxjs';
import { takeWhile } from 'rxjs/operators';
import { CreateMicroserviceConfig } from './messaging.server.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { TransportLayerToken, ServerEventsToken } from './messaging.server.tokens';
import { AllServerEvents, isCloseEvent } from './messaging.server.events';

export const createMicroservice = (config: CreateMicroserviceConfig) => {
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
  const listenerWithContext = messagingListener.run(context);

  if (event$) {
    const serverEvent$ = serverEventSubject.asObservable().pipe(takeWhile(e => !isCloseEvent(e)));
    const metadata = createEffectMetadata({ ask: lookup(context) });
    event$(serverEvent$, undefined, metadata).subscribe();
  }

  return {
    run: listenerWithContext.listen,
  }
};
