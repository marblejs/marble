import { Observable, fromEvent, of } from 'rxjs';
import { map, takeUntil, publish } from 'rxjs/operators';
import {
  combineEffects,
  combineMiddlewares,
  createEffectContext,
  createListener,
  Event,
  EventError,
} from '@marblejs/core';
import { WsEffect, WsErrorEffect, WsMiddlewareEffect, WsOutputEffect } from '../effects/websocket.effects.interface';
import { jsonTransformer } from '../transformer/websocket.json.transformer';
import { EventTransformer } from '../transformer/websocket.transformer.interface';
import { defaultError$ } from '../error/websocket.error.effect';
import { WebSocketClientConnection } from './websocket.server.interface';

export interface WebSocketListenerConfig {
  effects?: WsEffect<any, any>[];
  middlewares?: WsMiddlewareEffect<any, any>[];
  error$?: WsErrorEffect<Error, any, any>;
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

  const middleware$ = combineMiddlewares(...middlewares);
  const effect$ = combineEffects(...effects);

  const handle = (client: WebSocketClientConnection) => {
    const ctx = createEffectContext({ ask, client });

    const event$ = fromEvent<MessageEvent>(client, 'message').pipe(
      takeUntil(fromEvent(client, 'close')),
      map(e => eventTransformer.decode(e.data)),
      publish(e$ => middleware$(e$, ctx)),
      publish(e$ => effect$(e$, ctx)),
      publish(e$ => output$(e$, ctx)),
    );

    const subscribe = (input$: Observable<Event>) =>
      input$.subscribe(
        (event: Event) => client.sendResponse(event),
        (error: EventError) => {
          error$(of({ event: error.event, error }), ctx).subscribe(client.sendResponse);
          subscribe(event$);
        },
      );

    subscribe(event$);
  };

  handle.eventTransformer = eventTransformer;

  return handle;
});
