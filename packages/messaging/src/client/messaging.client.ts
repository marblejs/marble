import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Reader';
import * as T from 'fp-ts/lib/Task';
import * as TE from 'fp-ts/lib/TaskEither';
import { pipe, identity, constNull, constant, constVoid } from 'fp-ts/lib/function';
import {
  Event,
  matchEvent,
  useContext,
  LoggerToken,
  LoggerTag,
  LoggerLevel,
  isEventError,
  EventError,
  lookup,
  Context,
} from '@marblejs/core';
import { isNamedError, NamedError, throwException } from '@marblejs/core/dist/+internal/utils';
import { from, Observable, EMPTY, throwError, of, defer } from 'rxjs';
import { mergeMap, take, map, timeout } from 'rxjs/operators';
import { TransportMessage, DEFAULT_TIMEOUT, TransportMessageTransformer, TransportStrategy } from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { jsonTransformer } from '../transport/transport.transformer';

export interface MessagingClient {
  send: <T extends Event = Event, U extends Event = Event>(data: U) => Observable<T>;
  emit: <T extends Event = Event>(data: T) => Promise<void>;
  close: () => Promise<void>;
}

type ConfigurationBase =  {
  msgTransformer?: TransportMessageTransformer;
}

export type MessagingClientConfig =
  & TransportStrategy
  & ConfigurationBase
  ;

const getHttpModule: T.Task<O.Some<typeof import('@marblejs/http')> | O.None> =
  pipe(
    TE.tryCatch(() => import('@marblejs/http'), constNull),
    TE.map(O.some),
    TE.getOrElseW(constant(T.of(O.none))));

/**
 * @param config `MessagingClientConfig`
 * @returns asynchronous reader of `MessagingClient`
 * @since v3.0
 */
export const MessagingClient = (config: MessagingClientConfig) => {
  const {
    transport,
    options,
    msgTransformer = jsonTransformer,
  } = config;

  return pipe(
    R.ask<Context>(),
    R.map<Context, Promise<MessagingClient>>(async context => {
      const httpModule = await getHttpModule();
      const ask = lookup(context);
      const logger = useContext(LoggerToken)(ask);
      const transportLayer = pipe(
        provideTransportLayer(transport, options)(context),
        E.fold(throwException, identity));

      const connection = await transportLayer.connect({ isConsumer: false });

      const emit = async <I extends Event>(event: I): Promise<void> => {
        await connection.emitMessage(
          connection.getChannel(),
          { data: msgTransformer.encode(event) },
        );
      };

      const send = <O extends Event, I extends Event>(event: I): Observable<O> => {
        const channel = connection.getChannel();
        const message: TransportMessage<Buffer> = { data: msgTransformer.encode(event) };

        const catchErrorEvent = <V extends Event>(e: V) => {
          if (!e.error)
            return of(e);

          if (isEventError(e.error))
            return throwError(() => new EventError(e, e.error.message, e.error.data));

          if (isNamedError(e.error))
            return throwError(() => new NamedError(e.error.name, e.error.message));

          const parsedError = JSON.stringify(e.error);

          logger({
            tag: LoggerTag.MESSAGING,
            type: 'messagingClient',
            message: `Caught an error with invalid structure: ${parsedError}`,
            level: LoggerLevel.WARN,
          })();

          return throwError(() => new Error(parsedError));
        };

        return defer(() => from(connection.sendMessage(channel, message)).pipe(
          timeout(config.options.timeout ?? connection.config.timeout ?? DEFAULT_TIMEOUT),
          map(m => msgTransformer.decode<O>(m.data)),
          mergeMap(catchErrorEvent),
          take(1),
        ));
      };

      const close = async (): Promise<void> => {
        await connection.close();
      };

      // @TODO: refactor -> move to function
      pipe(
        httpModule,
        O.fold(constVoid, http => pipe(
          ask(http.HttpServerEventStreamToken),
          O.map(event$ => event$.pipe(
            matchEvent(http.ServerEvent.close),
            take(1),
            mergeMap(() => connection.close()))),
          O.getOrElseW(constant(EMPTY)),
        ).subscribe()),
      );

      return {
        emit,
        send,
        close,
      };
    }));
};

/**
 * An alias for `MessagingClient`
 *
 * @deprecated since version `v4.0`. Use `MessagingClient` instead.
 * Will be removed in version `v5.0`
 */
export const messagingClient = MessagingClient;
