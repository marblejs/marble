import {
  reader,
  ContextProvider,
  combineMiddlewares,
  combineEffects,
  createEffectMetadata,
} from '@marblejs/core';
import { Observable, Subscription, Subject, of } from 'rxjs';
import { map, publish, withLatestFrom, takeUntil, catchError, mergeMap, take } from 'rxjs/operators';
import {
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
  TransportLayer,
} from '../transport/transport.interface';
import { jsonTransformer } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect, MsgErrorEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken, ServerEventsToken } from './messaging.server.tokens';
import { AllServerEvents, ServerEvent } from './messaging.server.events';

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

  const handleConnection = (
    conn: TransportLayerConnection,
    serverEventsSubject: Subject<AllServerEvents>,
    ask: ContextProvider,
  ) => {
    let effectsSub: Subscription;

    const errorSubject = new Subject<Error>();
    const combinedEffects = combineEffects(...effects);
    const combinedMiddlewares = combineMiddlewares(...middlewares);
    const defaultMetadata = createEffectMetadata({ ask });

    const message$ = conn.consumeMessage().pipe(
      map(msg => ({ ...msg, data: msgTransformer.decode(msg.data) } as TransportMessage<any>)),
      mergeMap(msg => of(msg).pipe(
        publish(msg$ => combinedMiddlewares(msg$.pipe(map(m => m.data)), conn, defaultMetadata).pipe(
          withLatestFrom(msg$),
        )),
        map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
        publish(msg$ => combinedEffects(msg$.pipe(map(m => m.data)), conn, defaultMetadata).pipe(
          withLatestFrom(msg$),
        )),
        map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
        catchError(error => error$(of(msg.data), conn, createEffectMetadata({ ask, error })).pipe(
          map(data => ({ ...msg, data } as TransportMessage<any>)),
        )),
      ))
    );

    const onSubscribeEffectsOutput = (conn: TransportLayerConnection) => (msg: TransportMessage<any>) => {
      if (msg.replyTo) {
        conn.emitMessage(msg.replyTo, {
          data: msgTransformer.encode(msg.data),
          correlationId: msg.correlationId,
          raw: msg.raw,
        });
      }
    }

    const onSubscribeEffectsError = (errorSubject: Subject<Error>) => (error: Error) => {
      errorSubject.next(error);
      if (effectsSub.closed) { effectsSub = subscribeEffects(message$); }
    }

    const subscribeEffects = (input$: Observable<TransportMessage<any>>) => input$
      .pipe(takeUntil(conn.close$))
      .subscribe(
        onSubscribeEffectsOutput(conn),
        onSubscribeEffectsError(errorSubject),
      );

    conn.close$
      .pipe(take(1))
      .subscribe(() => serverEventsSubject.next(ServerEvent.close()));

    conn.error$
      .pipe(takeUntil(conn.close$))
      .subscribe(error => serverEventsSubject.next(ServerEvent.error(error)));

    effectsSub = subscribeEffects(message$);
  };

  const listen = (transportLayer: TransportLayer, ask: ContextProvider) => async () => {
    const { host, channel } = transportLayer.config;
    const serverEventsSubject = ask(ServerEventsToken).getOrElse(undefined as unknown as Subject<AllServerEvents>);
    const connection = await transportLayer.connect();

    handleConnection(connection, serverEventsSubject, ask);
    serverEventsSubject.next(ServerEvent.listening(host, channel));

    return connection;
  };

  return reader.map(ask => {
    const transportLayer = ask(TransportLayerToken).getOrElse(undefined as unknown as TransportLayer);

    return {
      listen: listen(transportLayer, ask),
    }
  });
};
