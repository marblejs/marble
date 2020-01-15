import {
  Event,
  combineMiddlewares,
  combineEffects,
  createEffectContext,
  createListener,
} from '@marblejs/core';
import { pipe } from 'fp-ts/lib/pipeable';
import { of, Observable } from 'rxjs';
import { map, publish, catchError, takeUntil } from 'rxjs/operators';
import {
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
} from '../transport/transport.interface';
import { jsonTransformer } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect, MsgErrorEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { inputLogger$, outputLogger$, errorLogger$ } from '../middlewares/messaging.eventLogger.middleware';

export interface MessagingListenerConfig {
  effects?: MsgEffect<any, any>[];
  middlewares?: MsgMiddlewareEffect<any, any>[];
  error$?: MsgErrorEffect;
  output$?: MsgOutputEffect;
  msgTransformer?: TransportMessageTransformer<any>;
}

export interface MessagingListener {
  (connection: TransportLayerConnection): void;
}

const defaultEffect$: MsgEffect = msg$ =>
  msg$;

const defaultOutput$: MsgOutputEffect = msg$ =>
  msg$;

const defaultError$: MsgErrorEffect = msg$ =>
  msg$.pipe(map(error => ({ type: 'UNHANDLED_ERROR', error: { name: error.name, message: error.message } } as Event)));

export const messagingListener = createListener<MessagingListenerConfig, MessagingListener>(config => ask => {
  const {
    middlewares = [],
    effects = [defaultEffect$],
    output$ = defaultOutput$,
    error$ = defaultError$,
    msgTransformer = jsonTransformer,
  } = config ?? {};

  const combinedEffects = combineEffects(...effects);
  const combinedMiddlewares = combineMiddlewares(inputLogger$, ...middlewares);

  const decode = (msg: TransportMessage<Buffer>): Event => ({
    ...msgTransformer.decode(msg.data),
    metadata: {
      replyTo: msg.replyTo,
      correlationId: msg.correlationId,
      raw: msg,
    }
  });

  const send = (connection: TransportLayerConnection) => (event: Event): void => {
    const { metadata, type, payload, error } = event;

    if (metadata && metadata.replyTo) {
      const { replyTo, correlationId, raw } = metadata;

      connection.emitMessage(replyTo, {
        data: msgTransformer.encode({ type, payload, error }),
        correlationId,
        raw,
      });
    }
  };

  return connection => {
    const ctx = createEffectContext({ ask, client: connection });

    const stream = pipe(
      connection.message$.pipe(map(decode)),
      e$ => combinedMiddlewares(e$, ctx),
      e$ => combinedEffects(e$, ctx),
      e$ => output$(e$, ctx),
      e$ => outputLogger$(e$, ctx),
      e$ => e$.pipe(
        catchError(error => {
          const e$ = of(error);
          return error$(e$, ctx).pipe(
            publish(e$ => errorLogger$(e$, ctx)),
          );
        }),
      )
    );

    const subscribe = (event$: Observable<Event<unknown, any, string>>) =>
      event$
        .pipe(takeUntil(connection.close$))
        .subscribe(
          send(connection),
          () => {
            console.error('Unexpected stream error!'); // @TODO: handle unexpected error
            subscribe(event$);
          },
          () => {
            subscribe(event$);
          },
        );

    subscribe(stream);
  };
});
