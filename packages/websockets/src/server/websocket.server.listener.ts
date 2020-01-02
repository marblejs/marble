import { Subject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import {
  combineEffects,
  combineMiddlewares,
  Event,
  createEffectContext,
  createListener,
} from '@marblejs/core';
import * as WS from '../websocket.interface';
import * as WSEffect from '../effects/ws-effects.interface';
import { jsonTransformer } from '../transformer/json.transformer';
import { EventTransformer } from '../transformer/transformer.inteface';
import { handleEffectsError } from '../error/ws-error.handler';
import { defaultError$ } from '../error/ws-error.effect';

export interface WebSocketListenerConfig {
  effects?: WSEffect.WsEffect<any, any>[];
  middlewares?: WSEffect.WsMiddlewareEffect<any, any>[];
  error$?: WSEffect.WsErrorEffect<Error, any, any>;
  eventTransformer?: EventTransformer<Event, any>;
  output$?: WSEffect.WsOutputEffect;
}

export interface WebSocketListener {
  (connection: WS.MarbleWebSocketClient): void;
  eventTransformer: EventTransformer<Event, any>;
}

export const webSocketListener = createListener<WebSocketListenerConfig, WebSocketListener>(config => ask => {
  const {
    effects = [],
    middlewares = [],
    error$ = defaultError$,
    eventTransformer = jsonTransformer as EventTransformer<any, any>,
    output$ = (out$: Observable<Event>) => out$,
  } = config ?? {};

  const combinedMiddlewares = combineMiddlewares(...middlewares);
  const combinedEffects = combineEffects(...effects);

  const handle = (client:  WS.MarbleWebSocketClient) => {
    const eventSubject$ = new Subject<any>();
    const incomingEventSubject$ = new Subject<WS.WebSocketData>();
    const ctx = createEffectContext({ ask, client });
    const decodedEvent$ = incomingEventSubject$.pipe(map(eventTransformer.decode));
    const middlewares$ = combinedMiddlewares(decodedEvent$, ctx);
    const effects$ = combinedEffects(eventSubject$, ctx);
    const effectsOutput$ = output$(effects$, ctx);

    const subscribeMiddlewares = (input$: Observable<any>) =>
      input$.subscribe(
        event => eventSubject$.next(event),
        error => handleEffectsError(ctx, error$)(error),
      );

    const subscribeEffects = (input$: Observable<any>) =>
      input$.subscribe(
        event => client.sendResponse(event),
        error => handleEffectsError(ctx, error$)(error),
      );

    let middlewaresSub = subscribeMiddlewares(middlewares$);
    let effectsSub = subscribeEffects(effectsOutput$);

    const onMessage = (event: WS.WebSocketData) => {
      if (middlewaresSub.closed) { middlewaresSub = subscribeMiddlewares(middlewares$); }
      if (effectsSub.closed) { effectsSub = subscribeEffects(effects$); }

      incomingEventSubject$.next(event);
    };

    const onClose = () => {
      client.removeListener('message', onMessage);
      middlewaresSub.unsubscribe();
      effectsSub.unsubscribe();
    };

    client.on('message', onMessage);
    client.once('close', onClose);
  };

  handle.eventTransformer = eventTransformer;

  return handle;
});
