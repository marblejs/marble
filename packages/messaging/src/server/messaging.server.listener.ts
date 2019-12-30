import {
  Event,
  combineMiddlewares,
  combineEffects,
  createEffectContext,
  useContext,
  EventError,
  createListener,
} from '@marblejs/core';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { flow } from 'fp-ts/lib/function';
import { Observable, Subscription, Subject, of, zip, OperatorFunction} from 'rxjs';
import { map, publish, takeUntil, catchError, take, mergeMapTo } from 'rxjs/operators';
import {
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
} from '../transport/transport.interface';
import { jsonTransformer } from '../transport/transport.transformer';
import { MsgEffect, MsgMiddlewareEffect, MsgErrorEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { inputLogger$, outputLogger$, errorLogger$ } from '../middlewares/messaging.eventLogger.middleware';
import { TransportLayerToken, ServerEventsToken } from './messaging.server.tokens';
import { AllServerEvents, ServerEvent } from './messaging.server.events';

type ProcessOperator = OperatorFunction<TransportMessage<any>, TransportMessage<any>>;

export interface MessagingListenerConfig {
  effects?: MsgEffect<any, any>[];
  middlewares?: MsgMiddlewareEffect<any, any>[];
  error$?: MsgErrorEffect;
  output$?: MsgOutputEffect;
  msgTransformer?: TransportMessageTransformer<any>;
}

export interface MessagingListener {
  listen: () => Promise<TransportLayerConnection>;
}

const defaultOutput$: MsgOutputEffect = msg$ => msg$.pipe(map(m => m.event));
const defaultError$: MsgErrorEffect = msg$ => msg$;
const defaultEffect$: MsgEffect = msg$ => msg$;

export const messagingListener = createListener<MessagingListenerConfig, MessagingListener>(config => ask => {
  const transportLayer = useContext(TransportLayerToken)(ask);

  const {
    effects = [defaultEffect$],
    middlewares = [],
    output$ = defaultOutput$,
    error$ = defaultError$,
    msgTransformer = jsonTransformer,
  } = config ?? {};

  const handleConnection = (conn: TransportLayerConnection, serverEventsSubject: Subject<AllServerEvents>) => {
    let effectsSub: Subscription;

    const errorSubject = new Subject<Error>();
    const combinedEffects = combineEffects(...effects);
    const combinedMiddlewares = combineMiddlewares(inputLogger$, ...middlewares);
    const ctx = createEffectContext({ ask, client: conn });

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

    const message$ = conn.message$.pipe(
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

  const listen = async () => {
    const { host, channel } = transportLayer.config;
    const serverEventsSubject = pipe(ask(ServerEventsToken), O.getOrElse(() => undefined as unknown as Subject<AllServerEvents>));
    const connection = await transportLayer.connect({ isConsumer: true });

    handleConnection(connection, serverEventsSubject);

    connection.status$
      .pipe(takeUntil(connection.close$))
      .subscribe(type => serverEventsSubject.next(ServerEvent.status(host,channel, type)));

    return connection;
  };

  return { listen };
});
