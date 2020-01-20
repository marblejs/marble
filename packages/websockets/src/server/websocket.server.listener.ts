import { Observable, fromEvent, of, Subject } from 'rxjs';
import { map, takeUntil, catchError } from 'rxjs/operators';
import {
  combineEffects,
  combineMiddlewares,
  createEffectContext,
  createListener,
  Event,
  EventError,
  EffectContext,
  LoggerTag,
  useContext,
  LoggerToken,
  LoggerLevel,
} from '@marblejs/core';
import { pipe } from 'fp-ts/lib/pipeable';
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

const defaultEffect$: WsEffect = msg$ => msg$;
const defaultOutput$: WsOutputEffect = (out$: Observable<Event>) => out$;

export const webSocketListener = createListener<WebSocketListenerConfig, WebSocketListener>(config => ask => {
  const {
    middlewares = [],
    effects = [],
    error$ = defaultError$,
    output$ = defaultOutput$,
    eventTransformer = jsonTransformer,
  } = config ?? {};

  const getEffects = () => effects.length ? effects : [defaultEffect$];

  const logger = useContext(LoggerToken)(ask);
  const combinedMiddlewares = combineMiddlewares(inputLogger$, ...middlewares);
  const combinedEffects = combineEffects(...getEffects());

  const processError$ = (ctx: EffectContext<WebSocketClientConnection>) => (error: Error) =>
    pipe(
      of(error),
      e$ => error$(e$, ctx),
      e$ => errorLogger$(e$, ctx),
    );

  const handle = (client: WebSocketClientConnection) => {
    const eventSubject = new Subject<Event>();
    const ctx = createEffectContext({ ask, client });
    const close$ = fromEvent(client, 'close');
    const message$ = fromEvent<MessageEvent>(client, 'message');

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
      e$ => e$.pipe(catchError(processError$(ctx))),
    );

    const outgoingEvent$ = pipe(
      eventSubject.asObservable(),
      e$ => combinedEffects(e$, ctx),
      e$ => output$(e$, ctx),
      e$ => e$.pipe(map(applyMetadata)),
      e$ => outputLogger$(e$, ctx),
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      e$ => e$.pipe(map(({ metadata, ...event }) => event)),
      e$ => e$.pipe(catchError(processError$(ctx))),
    );

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
          () => subscribeOutgoingEvent(input$),
        );

    const subscribeOutgoingEvent = (input$: Observable<Event>) =>
      input$
        .pipe(takeUntil(close$))
        .subscribe(
          (event: Event) => client.sendResponse(event),
          (error: EventError) => {
            const type = 'ServerListener';
            const message = `Unexpected error for OutgoingEvent stream: "${error.name}", "${error.message}"`;
            logger({ tag: LoggerTag.WEBSOCKETS, type, message, level: LoggerLevel.ERROR })();
            subscribeOutgoingEvent(input$);
          },
          () => subscribeOutgoingEvent(input$),
        );

      subscribeIncomingEvent(incomingEvent$);
      subscribeOutgoingEvent(outgoingEvent$);
  };

  handle.eventTransformer = eventTransformer;

  return handle;
});
