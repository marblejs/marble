import {
  Event,
  combineMiddlewares,
  combineEffects,
  createEffectContext,
  createListener,
  useContext,
  LoggerToken,
  LoggerTag,
  LoggerLevel,
} from '@marblejs/core';
import { pipe } from 'fp-ts/lib/pipeable';
import { identity } from 'fp-ts/lib/function';
import { Observable, Subject, defer } from 'rxjs';
import { map, catchError, takeUntil } from 'rxjs/operators';
import { TransportMessageTransformer, TransportLayerConnection } from '../transport/transport.interface';
import { jsonTransformer, decodeMessage } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect, MsgErrorEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { inputLogger$, outputLogger$, exceptionLogger$ } from '../middlewares/messaging.eventLogger.middleware';
import { outputRouter$, outputErrorEncoder$ } from '../middlewares/messaging.eventOutput.middleware';
import { idApplier$ } from '../middlewares/messaging.eventInput.middleware';
import { rejectUnhandled$ } from '../middlewares/messaging.ack.middleware';

export interface MessagingListenerConfig {
  effects?: MsgEffect[];
  middlewares?: MsgMiddlewareEffect[];
  error$?: MsgErrorEffect;
  output$?: MsgOutputEffect;
  msgTransformer?: TransportMessageTransformer;
}

export interface MessagingListener {
  (connection: TransportLayerConnection): void;
}

const defaultError$: MsgErrorEffect = event$ =>
  event$.pipe(
    map(error => ({
      type: 'UNHANDLED_ERROR',
      error: { name: error.name, message: error.message }
    })),
  );

export const messagingListener = createListener<MessagingListenerConfig, MessagingListener>(config => ask => {
  const {
    middlewares = [],
    effects = [],
    output$ = identity,
    error$ = defaultError$,
    msgTransformer = jsonTransformer,
  } = config ?? {};

  const logger = useContext(LoggerToken)(ask);
  const combinedEffects = combineEffects(...effects);
  const combinedMiddlewares = combineMiddlewares(idApplier$, rejectUnhandled$, inputLogger$, ...middlewares);

  return connection => {
    const errorSubject = new Subject<Error>();
    const eventSubject = new Subject<Event>();
    const decode = decodeMessage({ msgTransformer, errorSubject });
    const ctx = createEffectContext({ ask, client: connection });

    const send = (connection: TransportLayerConnection) => (event: Event): void => {
      const { metadata, type, payload, error } = event;
      const { replyTo, correlationId, raw } = metadata ?? {};

      connection.emitMessage(replyTo ?? '', {
        data: msgTransformer.encode({ type, payload, error }),
        correlationId,
        replyTo,
        raw,
      });
    };

    const incomingEvent$ = pipe(
      connection.message$,
      map(decode),
      e$ => combinedMiddlewares(e$, ctx),
      e$ => defer(() => processError(e$)),
    );

    const outgoingEvent$ = pipe(
      eventSubject.asObservable(),
      e$ => combinedEffects(e$, ctx),
      e$ => outputRouter$(e$, ctx),
      e$ => output$(e$, ctx),
      e$ => outputLogger$(e$, ctx),
      e$ => outputErrorEncoder$(e$, ctx),
      e$ => defer(() => processError(e$)),
    );

    const errorEvent$ = pipe(
      errorSubject.asObservable(),
      e$ => error$(e$, ctx),
      e$ => exceptionLogger$(e$, ctx),
    );

    const processError = <T>(origin$: Observable<T>): Observable<T> =>
      origin$.pipe(catchError(error => {
        errorSubject.next(error);
        return processError(origin$);
      }));

    const subscribeIncomingEvent = (event$: Observable<Event>) =>
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
          () => {
            const type = 'ServerListener';
            const message = `IncomingEvent stream completes`;
            logger({ tag: LoggerTag.MESSAGING, type, message, level: LoggerLevel.DEBUG })();
          },
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
          () => {
            const type = 'ServerListener';
            const message = `OutgoingEvent stream completes`;
            logger({ tag: LoggerTag.MESSAGING, type, message, level: LoggerLevel.DEBUG })();
          },
        );

    subscribeIncomingEvent(incomingEvent$);
    subscribeOutgoingEvent(outgoingEvent$);
    subscribeOutgoingEvent(errorEvent$);
  };
});
