import {
  reader,
  Event,
  ContextProvider,
  combineMiddlewares,
  combineEffects,
  createEffectContext,
  useContext,
  EventError,
} from '@marblejs/core';
import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Reader';
import { pipe } from 'fp-ts/lib/pipeable';
import { Observable, Subscription, Subject, of, zip } from 'rxjs';
import { map, publish, takeUntil, catchError, take } from 'rxjs/operators';
import {
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
  TransportLayer,
} from '../transport/transport.interface';
import { jsonTransformer } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect, MsgErrorEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken, ServerEventsToken } from './messaging.server.tokens';
import { AllServerEvents, ServerEvent } from './messaging.server.events';

export interface MessagingListenerConfig {
  effects?: MsgEffect<any, any>[];
  middlewares?: MsgMiddlewareEffect<any, any>[];
  error$?: MsgErrorEffect;
  output$?: MsgOutputEffect;
  msgTransformer?: TransportMessageTransformer<any>;
}

const defaultOutput$: MsgOutputEffect = msg$ => msg$.pipe(map(m => m.event));
const defaultError$: MsgErrorEffect = msg$ => msg$;
const defaultEffect$: MsgEffect = msg$ => msg$;

export const messagingListener = (config: MessagingListenerConfig = {}) => {
  const {
    effects = [defaultEffect$],
    middlewares = [],
    output$ = defaultOutput$,
    error$ = defaultError$,
    msgTransformer = jsonTransformer,
  } = config;

  const handleConnection = (
    conn: TransportLayerConnection,
    serverEventsSubject: Subject<AllServerEvents>,
    ask: ContextProvider,
  ) => {
    let effectsSub: Subscription;

    const errorSubject = new Subject<Error>();
    const combinedEffects = combineEffects(...effects);
    const combinedMiddlewares = combineMiddlewares(...middlewares);
    const ctx = createEffectContext({ ask, client: conn });

    const decode = (msg: TransportMessage<Buffer>): TransportMessage<Event> => ({
      ...msg,
      data: { ...msgTransformer.decode(msg.data), raw: msg.raw },
    });

    const message$ = conn.message$.pipe(
      map(decode),
      publish(msg$ => zip(
        combinedMiddlewares(msg$.pipe(map(m => m.data)), ctx),
        msg$,
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
      publish(msg$ => zip(
        combinedEffects(msg$.pipe(map(m => m.data)), ctx),
        msg$,
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
      publish(msg$ => zip(
        output$(msg$.pipe(map(m => ({ event: m.data, initiator: m }))), ctx),
        msg$,
      )),
      map(([data, msg]) => ({ ...msg, data } as TransportMessage<any>)),
      catchError((error: EventError) => error$(of({ event: error.event, error }), ctx).pipe(
        map(data => ({ data } as TransportMessage<any>)),
      )),
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
      .pipe(takeUntil(conn.close$))
      .subscribe(
        onSubscribeEffectsOutput(conn),
        onSubscribeEffectsError(errorSubject),
        onSubscribeEffectsClose,
      );

    conn.close$
      .pipe(take(1))
      .subscribe(() => serverEventsSubject.next(ServerEvent.close()));

    conn.error$
      .pipe(takeUntil(conn.close$))
      .subscribe(error => serverEventsSubject.next(ServerEvent.error(error)));

    effectsSub = subscribeEffects(message$);
  };

  const listen = (transportLayer: TransportLayer, ask: ContextProvider) => async () => {
    const { host, channel } = transportLayer.config;
    const serverEventsSubject = pipe(ask(ServerEventsToken), O.getOrElse(() => undefined as unknown as Subject<AllServerEvents>));
    const connection = await transportLayer.connect({ isConsumer: true });

    handleConnection(connection, serverEventsSubject, ask);

    connection.status$
      .pipe(takeUntil(connection.close$))
      .subscribe(type => serverEventsSubject.next(ServerEvent.status(host,channel, type)));

    return connection;
  };

  return pipe(reader, R.map(ask => {
    const transportLayer = useContext(TransportLayerToken)(ask);

    return {
      listen: listen(transportLayer, ask),
    }
  }));
};
