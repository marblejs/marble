import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Reader';
import { pipe } from 'fp-ts/lib/pipeable';
import { reader, ServerEventStreamToken,  matchEvent, ServerEvent, AllServerEvents } from '@marblejs/core';
import { from, Observable, EMPTY } from 'rxjs';
import { mergeMap, take, map, timeout } from 'rxjs/operators';
import { TransportMessage, TransportLayerConnection, TransportLayerConfig } from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { jsonTransformer } from '../transport/transport.transformer';
import { MessagingClient, MessagingClientConfig } from './messaging.client.interface';

export const messagingClient = (config: MessagingClientConfig) => {
  const {
    transport,
    options,
    msgTransformer = jsonTransformer,
  } = config;

  const emit = (conn: TransportLayerConnection) => async <T>(msg: T) => {
    await conn.emitMessage(
      conn.getChannel(),
      { data: msgTransformer.encode(msg as any) },
    );
  }

  const send = (config: TransportLayerConfig, conn: TransportLayerConnection) => <T, U>(msg: T): Observable<U> => {
    const channel = conn.getChannel();
    const message: TransportMessage<Buffer> = { data: msgTransformer.encode(msg as any) };

    return from(conn.sendMessage(channel, message)).pipe(
      timeout(config.timeout),
      map(m => msgTransformer.decode(m.data) as U),
      take(1),
    );
  }

  const close = (conn: TransportLayerConnection) => async () => {
    await conn.close();
  }

  const teardownOnClose$ = (conn: TransportLayerConnection) => (event$: Observable<AllServerEvents>) =>
    event$.pipe(
      matchEvent(ServerEvent.close),
      take(1),
      mergeMap(() => conn.close()),
    );

  return pipe(reader, R.map(async ask => {
    const transportLayer = provideTransportLayer(transport, options);
    const connection = await transportLayer.connect({ isConsumer: false });

    pipe(
      ask(ServerEventStreamToken),
      O.map(teardownOnClose$(connection)),
      O.getOrElse(() => EMPTY as Observable<any>),
    ).subscribe();

    return {
      emit: emit(connection),
      send: send(transportLayer.config, connection),
      close: close(connection),
    } as MessagingClient;
  }));
};
