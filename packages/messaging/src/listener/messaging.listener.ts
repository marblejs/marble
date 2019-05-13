import {
  reader,
  ContextReader,
  ContextProvider,
  combineMiddlewares,
  combineEffects,
  createEffectMetadata,
} from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { from, Observable, Subscription } from 'rxjs';
import { map, mergeMap, publish, withLatestFrom } from 'rxjs/operators';
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

    const message$ = conn.handleMessage().pipe(
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
            console.log(msg);
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
      .pipe(mergeMap(server => server.connect()))
      .subscribe(conn => handleConnection(conn, ask));

    // @TODO: simulate msgs posting
    transportLayer
      .then(server => server.connect())
      .then(conn => {
        const msg1 = msgTransformer.encode({ type: 'ADD', payload: 1 });
        const msg2 = msgTransformer.encode({ type: 'ADD', payload: 2 });
        const msg3 = msgTransformer.encode({ type: 'SUM' });

        const msg4 = msgTransformer.encode({ type: 'ADD', payload: 3 });
        const msg5 = msgTransformer.encode({ type: 'ADD', payload: 6 });
        const msg6 = msgTransformer.encode({ type: 'SUM' });

        setTimeout(() => {
          conn.sendMessage(options.queue, {
            data: msg1,
          });
        }, 1);

        setTimeout(() => {
          conn.sendMessage(options.queue, {
            data: msg2,
          });
        }, 2);

        setTimeout(() => {
          conn.sendMessage(options.queue, {
            data: msg3,
            replyTo: options.queue + '_1',
            correlationId: createUuid(),
          });
        }, 3);

        setTimeout(() => {
          conn.sendMessage(options.queue, {
            data: msg4,
          });
        }, 10);

        setTimeout(() => {
          conn.sendMessage(options.queue, {
            data: msg5,
          });
        }, 11);

        setTimeout(() => {
          conn.sendMessage(options.queue, {
            data: msg6,
            replyTo: options.queue + '_2',
            correlationId: createUuid(),
          });
        }, 12);
      });
  });
};
