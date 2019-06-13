import {
  reader,
  ContextProvider,
  combineMiddlewares,
  combineEffects,
  createEffectMetadata,
} from '@marblejs/core';
import { Observable, Subscription, Subject, merge } from 'rxjs';
import { map, publish, withLatestFrom, takeUntil } from 'rxjs/operators';
import {
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
  TransportLayer,
} from '../transport/transport.interface';
import { jsonTransformer } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken } from '../server/messaging.server.tokens';

export interface MessagingListenerConfig {
  effects?: MsgEffect<any, any>[];
  middlewares?: MsgMiddlewareEffect<any, any>[];
  error$?: MsgErrorEffect;
  msgTransformer?: TransportMessageTransformer<any>;
}

export const messagingListener = (config: MessagingListenerConfig = {}) => {
  const {
    effects = [],
    middlewares = [],
    error$ = (msg$ => msg$) as MsgErrorEffect,
    msgTransformer = jsonTransformer,
  } = config;

  const handleConnection = (conn: TransportLayerConnection, ask: ContextProvider) => {
    let effectsSub: Subscription;

    const errorSubject = new Subject<Error>();
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

    error$(merge(
      errorSubject.asObservable(),
      conn.error$,
    ), conn, defaultMetadata)
      .pipe(takeUntil(conn.close$))
      .subscribe();

    const subscribeEffects = (input$: Observable<TransportMessage<any>>) => input$
      .pipe(takeUntil(conn.close$))
      .subscribe(
        msg => {
          if (msg.replyTo) {
            conn.sendMessage(msg.replyTo, {
              data: msgTransformer.encode(msg.data),
              correlationId: msg.correlationId,
              raw: msg.raw,
            });
          }
          conn.ack(msg.raw);
        },
        error => {
          errorSubject.next(error);
          if (effectsSub.closed) { effectsSub = subscribeEffects(message$); }
        },
      );

    effectsSub = subscribeEffects(message$);
  };

  const listen = (transportLayer: Promise<TransportLayer>, ask: ContextProvider) => async () => {
    const layer = await transportLayer;
    const conn = await layer.connect();
    await conn.consumeMessage();
    await handleConnection(conn, ask);
    return conn;
  };

  return reader.map(ask => {
    const transportLayer = ask(TransportLayerToken)
      .map(async layer => await layer)
      .getOrElse(undefined as unknown as Promise<TransportLayer>);

    return {
      listen: listen(transportLayer, ask),
    }
  });
};
