import { Observable, fromEvent, Subject, defer, firstValueFrom } from 'rxjs';
import { map, takeUntil, catchError } from 'rxjs/operators';
import {
  combineEffects,
  combineMiddlewares,
  createEffectContext,
  createListener,
  Event,
  EventError,
  LoggerTag,
  useContext,
  LoggerToken,
  LoggerLevel,
} from '@marblejs/core';
import { pipe } from 'fp-ts/lib/function';
import { WsEffect, WsErrorEffect, WsMiddlewareEffect, WsOutputEffect } from '../effects/websocket.effects.interface';
import { jsonTransformer } from '../transformer/websocket.json.transformer';
import { EventTransformer } from '../transformer/websocket.transformer.interface';
import { defaultError$ } from '../error/websocket.error.effect';
import { inputLogger$, outputLogger$, errorLogger$ } from '../middlewares/websockets.eventLogger.middleware';
import { WebSocketClientConnection } from './websocket.server.interface';

export interface WebSocketListenerConfig {
  effects?: WsEffect<any, any>[];
  middlewares?: WsMiddlewareEffect<any, any>[];
  error$?: WsErrorEffect;
  eventTransformer?: EventTransformer<any>;
  output$?: WsOutputEffect;
}

export interface WebSocketListener {
  (connection: WebSocketClientConnection): void;
  eventTransformer: EventTransformer<any>;
}

const defaultOutput$: WsOutputEffect = (out$: Observable<Event>) => out$;

export const webSocketListener = createListener<WebSocketListenerConfig, WebSocketListener>(config => ask => {
  const {
    middlewares = [],
    effects = [],
    error$ = defaultError$,
    output$ = defaultOutput$,
    eventTransformer = jsonTransformer,
  } = config ?? {};

  const logger = useContext(LoggerToken)(ask);
  const combinedMiddlewares = combineMiddlewares(inputLogger$, ...middlewares);
  const combinedEffects = combineEffects(...effects);

  const handle = (client: WebSocketClientConnection) => {
    const errorSubject = new Subject<Error>();
    const eventSubject = new Subject<Event>();
    const ctx = createEffectContext({ ask, client });
    const close$ = fromEvent(client, 'close');
    const message$ = fromEvent<{ data: any }>(client, 'message');

    const applyMetadata = (event: Event): Event => ({
      ...event,
      metadata: {
        replyTo: client.address,
        correlationId: client.id,
      },
    });

    const incomingEvent$ = pipe(
      message$,
      e$ => e$.pipe(map(msg => eventTransformer.decode(msg.data))),
      e$ => e$.pipe(map(applyMetadata)),
      e$ => combinedMiddlewares(e$, ctx),
      e$ => e$.pipe(catchError(error => defer(() => processError(incomingEvent$)(error)))),
    );

    const outgoingEvent$ = pipe(
      eventSubject.asObservable(),
      e$ => combinedEffects(e$, ctx),
      e$ => output$(e$, ctx),
      e$ => e$.pipe(map(applyMetadata)),
      e$ => outputLogger$(e$, ctx),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      e$ => e$.pipe(map(({ metadata, ...event }) => event)),
      e$ => e$.pipe(catchError(error => defer(() => processError(outgoingEvent$)(error)))),
    );

    const errorEvent$ = pipe(
      errorSubject.asObservable(),
      e$ => error$(e$, ctx),
      e$ => errorLogger$(e$, ctx),
    );

    const processError = (originStream$: Observable<any>) => (error: Error) => {
      errorSubject.next(error);
      return originStream$;
    };

    const subscribeIncomingEvent = (input$: Observable<Event>) =>
      input$
        .pipe(takeUntil(close$))
        .subscribe(
          (event: Event) => eventSubject.next(event),
          (error: EventError) => {
            const type = 'ServerListener';
            const message = `Unexpected error for IncomingEvent stream: "${error.name}", "${error.message}"`;
            logger({ tag: LoggerTag.WEBSOCKETS, type, message, level: LoggerLevel.ERROR })();
            subscribeIncomingEvent(input$);
          },
          () => {
            const type = 'ServerListener';
            const message = `OutgoingEvent stream completes`;
            logger({ tag: LoggerTag.WEBSOCKETS, type, message, level: LoggerLevel.DEBUG })();
          },
        );

    const subscribeOutgoingEvent = (input$: Observable<Event>) =>
      input$
        .pipe(takeUntil(close$))
        .subscribe(
          (event: Event) => firstValueFrom(client.sendResponse(event)),
          (error: EventError) => {
            const type = 'ServerListener';
            const message = `Unexpected error for OutgoingEvent stream: "${error.name}", "${error.message}"`;
            logger({ tag: LoggerTag.WEBSOCKETS, type, message, level: LoggerLevel.ERROR })();
            subscribeOutgoingEvent(input$);
          },
          () => {
            const type = 'ServerListener';
            const message = `OutgoingEvent stream completes`;
            logger({ tag: LoggerTag.WEBSOCKETS, type, message, level: LoggerLevel.DEBUG })();
          },
        );

      subscribeIncomingEvent(incomingEvent$);
      subscribeOutgoingEvent(outgoingEvent$);
      subscribeOutgoingEvent(errorEvent$);
  };

  handle.eventTransformer = eventTransformer;

  return handle;
});
