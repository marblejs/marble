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
import { WebSocketClientConnection } from './websocket.server.interface';

export interface WebSocketListenerConfig {
  effects?: WsEffect<any, any>[];
  middlewares?: WsMiddlewareEffect<any, any>[];
  error$?: WsErrorEffect;
  eventTransformer?: EventTransformer<Event, any>;
  output$?: WsOutputEffect;
}

export interface WebSocketListener {
  (connection: WebSocketClientConnection): void;
  eventTransformer: EventTransformer<Event, any>;
}

const defaultEffect$: WsEffect = msg$ => msg$;
const defaultOutput$: WsOutputEffect = (out$: Observable<Event>) => out$;

export const webSocketListener = createListener<WebSocketListenerConfig, WebSocketListener>(config => ask => {
  const {
    middlewares = [],
    effects = [defaultEffect$],
    error$ = defaultError$,
    output$ = defaultOutput$,
    eventTransformer = jsonTransformer as EventTransformer<Event, any>,
  } = config ?? {};

  const logger = useContext(LoggerToken)(ask);
  const combinedMiddlewares = combineMiddlewares(...middlewares); // @TODO: create inputLogger$
  const combinedEffects = combineEffects(...effects);

  const processError$ = (ctx: EffectContext<WebSocketClientConnection>) => (error: Error) =>
    pipe(
      of(error),
      e$ => error$(e$, ctx),
      // e$ => errorLogger$(e$, ctx), // @TODO
    );

  const handle = (client: WebSocketClientConnection) => {
    const eventSubject = new Subject<Event>();
    const ctx = createEffectContext({ ask, client });
    const close$ = fromEvent(client, 'close');
    const message$ = fromEvent<MessageEvent>(client, 'message');

    const incomingEvent$ = pipe(
      message$,
      e$ => e$.pipe(map(e => eventTransformer.decode(e.data))),
      e$ => combinedMiddlewares(e$, ctx),
      e$ => e$.pipe(catchError(processError$(ctx))),
    );

    const outgoingEvent$ = pipe(
      eventSubject.asObservable(),
      e$ => combinedEffects(e$, ctx),
      e$ => output$(e$, ctx),
      // e$ => outputLogger$(e$, ctx), // @TODO
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
          () => subscribeIncomingEvent(input$),
        );

    const subscribeOutgoingEvent = (input$: Observable<Event>) =>
      input$
        .pipe(takeUntil(close$))
        .subscribe(
          (event: Event) => client.sendResponse(event),
          (error: EventError) => {
            const type = 'ServerListener';
            const message = `Unexpected error OutgoingEvent stream: "${error.name}", "${error.message}"`;
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
