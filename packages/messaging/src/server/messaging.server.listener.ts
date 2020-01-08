import {
  Event,
  combineMiddlewares,
  combineEffects,
  createEffectContext,
  createListener,
} from '@marblejs/core';
import { Subject, of} from 'rxjs';
import { map, publish, takeUntil, catchError, mergeMapTo, mergeMap, tap } from 'rxjs/operators';
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
  msg$.pipe(map(m => m.event));

const defaultError$: MsgErrorEffect = msg$ =>
  msg$.pipe(map(({ event, error }) => ({
    type: event.type,
    payload: event.payload,
    error: { name: error.name, message: error.message },
  } as Event)));

export const messagingListener = createListener<MessagingListenerConfig, MessagingListener>(config => ask => {
  const {
    effects = [defaultEffect$],
    middlewares = [],
    output$ = defaultOutput$,
    error$ = defaultError$,
    msgTransformer = jsonTransformer,
  } = config ?? {};

  return connection => {
    const combinedEffects = combineEffects(...effects);
    const combinedMiddlewares = combineMiddlewares(inputLogger$, ...middlewares);
    const ctx = createEffectContext({ ask, client: connection });

    const decode = (msg: TransportMessage<Buffer>): TransportMessage<Event> => ({
      ...msg,
      data: { ...msgTransformer.decode(msg.data), raw: msg },
    });

    const subject = new Subject<TransportMessage<Buffer>>();

    subject
      .pipe(
        takeUntil(connection.close$),
        map(decode),
        mergeMap(initiator => of(initiator.data).pipe(
          publish(e$ => combinedMiddlewares(e$, ctx)),
          publish(e$ => combinedEffects(e$, ctx)),
          publish(e$ => outputLogger$(e$.pipe(map(event => ({ initiator, event }))), ctx)),
          publish(e$ => output$(e$.pipe(map(event => ({ initiator, event }))), ctx)),
          catchError(error => {
            const e$ = of({ event: initiator.data, error });
            return errorLogger$(e$, ctx).pipe(
              mergeMapTo(error$(e$, ctx)),
            );
          }),
          tap(async event => {
            if (initiator.replyTo) {
              const { replyTo, correlationId, raw } = initiator;
              const { type, payload, error } = event;
              return connection.emitMessage(replyTo, {
                data: msgTransformer.encode({ type, payload, error }),
                correlationId,
                raw,
              });
            }

            return true;
          }),
        )),
      )
      .subscribe();

    connection.message$
      .pipe(takeUntil(connection.close$))
      .subscribe(msg => subject.next(msg));
  };
});
