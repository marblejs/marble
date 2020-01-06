import {
  Event,
  combineMiddlewares,
  combineEffects,
  createEffectContext,
  EventError,
  createListener,
} from '@marblejs/core';
import { flow } from 'fp-ts/lib/function';
import { Observable, Subscription, Subject, of, zip, OperatorFunction} from 'rxjs';
import { map, publish, takeUntil, catchError, mergeMapTo } from 'rxjs/operators';
import {
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
} from '../transport/transport.interface';
import { jsonTransformer } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect, MsgErrorEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { inputLogger$, outputLogger$, errorLogger$ } from '../middlewares/messaging.eventLogger.middleware';

type ProcessOperator = OperatorFunction<TransportMessage<any>, TransportMessage<any>>;

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

const defaultOutput$: MsgOutputEffect = msg$ => msg$.pipe(map(m => m.event));
const defaultError$: MsgErrorEffect = msg$ => msg$;
const defaultEffect$: MsgEffect = msg$ => msg$;

export const messagingListener = createListener<MessagingListenerConfig, MessagingListener>(config => ask => {
  const {
    effects = [defaultEffect$],
    middlewares = [],
    output$ = defaultOutput$,
    error$ = defaultError$,
    msgTransformer = jsonTransformer,
  } = config ?? {};

  return connection => {
    let effectsSub: Subscription;

    const errorSubject = new Subject<Error>();
    const combinedEffects = combineEffects(...effects);
    const combinedMiddlewares = combineMiddlewares(inputLogger$, ...middlewares);
    const ctx = createEffectContext({ ask, client: connection });

    const toUnhandledErrorEvent = ({ name, message }: Error): Observable<Event> =>
      of({ type: 'UNHANDLED_ERROR', error: { name, message } });

    const decode = (msg: TransportMessage<Buffer>): TransportMessage<Event> => ({
      ...msg,
      data: { ...msgTransformer.decode(msg.data), raw: msg },
    });

    const processMiddlewares: ProcessOperator = flow(
      publish(msg$ => zip(
        combinedMiddlewares(msg$.pipe(map(m => m.data)), ctx).pipe(
          catchError(toUnhandledErrorEvent),
        ),
        msg$,
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
    );

    const processEffects: ProcessOperator = flow(
      publish(msg$ => zip(
        combinedEffects(msg$.pipe(map(m => m.data)), ctx).pipe(
          catchError(toUnhandledErrorEvent),
        ),
        msg$,
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
    );

    const processOutput: ProcessOperator = flow(
      publish(msg$ => zip(
        outputLogger$(msg$.pipe(map(m => ({ event: m.data, initiator: m }))), ctx).pipe(
          catchError(toUnhandledErrorEvent),
        ),
        msg$,
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
      publish(msg$ => zip(
        output$(msg$.pipe(map(m => ({ event: m.data, initiator: m }))), ctx).pipe(
          catchError(toUnhandledErrorEvent),
        ),
        msg$,
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
    );

    const message$ = connection.message$.pipe(
      map(decode),
      processMiddlewares,
      processEffects,
      processOutput,
      catchError((error: EventError) => {
        const e$ = of({ event: error.event, error });
        return errorLogger$(e$, ctx).pipe(
          mergeMapTo(error$(e$, ctx)),
          map(data => ({ data } as TransportMessage<any>)),
        );
      }),
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

    const onSubscribeEffectsClose = () => {
      effectsSub = subscribeEffects(message$);
    }

    const subscribeEffects = (input$: Observable<TransportMessage<any>>) => input$
      .pipe(takeUntil(connection.close$))
      .subscribe(
        onSubscribeEffectsOutput(connection),
        onSubscribeEffectsError(errorSubject),
        onSubscribeEffectsClose,
      );

    effectsSub = subscribeEffects(message$);
  };
});
