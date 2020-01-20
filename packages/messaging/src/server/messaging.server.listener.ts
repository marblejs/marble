import {
  Event,
  combineMiddlewares,
  combineEffects,
  createEffectContext,
  createListener,
  EffectContext,
  useContext,
  LoggerToken,
  LoggerTag,
  LoggerLevel,
} from '@marblejs/core';
import { pipe } from 'fp-ts/lib/pipeable';
import { of, Observable, Subject } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
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
    effects = [],
    output$ = defaultOutput$,
    error$ = defaultError$,
    msgTransformer = jsonTransformer,
  } = config ?? {};

  const getEffects = () => effects.length ? effects : [defaultEffect$];

  const logger = useContext(LoggerToken)(ask);
  const combinedEffects = combineEffects(...getEffects());
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
        replyTo,
        raw,
      });
    }
  };

  const processError$ = (ctx: EffectContext<TransportLayerConnection>) => (error: Error) =>
    pipe(
      of(error),
      e$ => error$(e$, ctx),
      e$ => errorLogger$(e$, ctx),
    );

  return connection => {
    const eventSubject = new Subject<Event>();
    const ctx = createEffectContext({ ask, client: connection });

    const incomingEvent$ = pipe(
      connection.message$,
      e$ => e$.pipe(map(decode)),
      e$ => combinedMiddlewares(e$, ctx),
      e$ => e$.pipe(catchError(processError$(ctx))),
    );

    const outgoingEvent$ = pipe(
      eventSubject.asObservable(),
      e$ => combinedEffects(e$, ctx),
      e$ => output$(e$, ctx),
      e$ => outputLogger$(e$, ctx),
      e$ => e$.pipe(catchError(processError$(ctx))),
    );

    const subscribeIncomingEvent = (event$: Observable<Event<unknown, any, string>>) =>
      event$
        .pipe(takeUntil(connection.close$))
        .subscribe(
          event => eventSubject.next(event),
          (error: Error) => {
            const type = 'ServerListener';
            const message = `Unexpected error for IncomingEvent stream: "${error.name}", "${error.message}"`;
            logger({ tag: LoggerTag.MESSAGING, type, message, level: LoggerLevel.ERROR })();
            subscribeIncomingEvent(event$);
          },
          () => subscribeOutgoingEvent(event$),
        );

    const subscribeOutgoingEvent = (event$: Observable<Event<unknown, any, string>>) =>
      event$
        .pipe(takeUntil(connection.close$))
        .subscribe(
          event => send(connection)(event),
          (error: Error) => {
            const type = 'ServerListener';
            const message = `Unexpected error for OutgoingEvent stream: "${error.name}", "${error.message}"`;
            logger({ tag: LoggerTag.MESSAGING, type, message, level: LoggerLevel.ERROR })();
          },
          () => subscribeOutgoingEvent(event$),
        );

    subscribeIncomingEvent(incomingEvent$);
    subscribeOutgoingEvent(outgoingEvent$);
  };
});
