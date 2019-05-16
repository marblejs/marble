import {
  reader,
  ContextReader,
  ContextProvider,
  combineMiddlewares,
  combineEffects,
  createEffectMetadata,
} from '@marblejs/core';
import { from, Observable, Subscription } from 'rxjs';
import { map, mergeMap, publish, withLatestFrom, tap } from 'rxjs/operators';
import {
  Transport,
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
} from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { jsonTransformer } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect } from '../effects/messaging-effects.interface';

export interface MessagingListenerConfig {
  effects?: MsgEffect<any, any>[];
  middlewares?: MsgMiddlewareEffect<any, any>[];
  transport?: Transport;
  msgTransformer?: TransportMessageTransformer<any>;
  options?: any; // @TODO
}

export const messagingListener = (config: MessagingListenerConfig = {}) => {
  const {
    effects = [],
    middlewares = [],
    transport = Transport.TCP,
    msgTransformer = jsonTransformer,
    options = {},
  } = config;

  const handleConnection = (conn: TransportLayerConnection, ask: ContextProvider) => {
    let effectsSub: Subscription;

    const combinedEffects = combineEffects(...effects);
    const combinedMiddlewares = combineMiddlewares(...middlewares);
    const defaultMetadata = createEffectMetadata({ ask });

    const message$ = conn.message$.pipe(
      map(msg => ({ ...msg, data: msgTransformer.decode(msg.data) } as TransportMessage<any>)),
      publish(msg$ => combinedMiddlewares(msg$.pipe(map(m => m.data)), conn, defaultMetadata).pipe(
        withLatestFrom(msg$),
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
      publish(msg$ => combinedEffects(msg$.pipe(map(m => m.data)), conn, defaultMetadata).pipe(
        withLatestFrom(msg$),
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
    );

    const subscribeEffects = (input$: Observable<TransportMessage<any>>) =>
      input$.subscribe(
        msg => {
          if (msg.replyTo) {
            conn.sendMessage(msg.replyTo, {
              data: msgTransformer.encode(msg.data),
              correlationId: msg.correlationId,
              raw: msg.raw,
            });
          }
        },
        error => {
          // @TODO: handle errors
          console.error(error);
          if (effectsSub.closed) { effectsSub = subscribeEffects(message$); }
        },
      );

    effectsSub = subscribeEffects(message$);
  };

  return (): ContextReader => reader.map(ask => {
    const transportLayer = provideTransportLayer(transport, options);

    from(transportLayer)
      .pipe(
        mergeMap(server => server.connect()),
        tap(conn => conn.consumeMessage()),
      )
      .subscribe(conn => handleConnection(conn, ask));
  });
};
