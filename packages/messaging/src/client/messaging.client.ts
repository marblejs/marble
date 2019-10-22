import * as O from 'fp-ts/lib/Option';
import * as R from 'fp-ts/lib/Reader';
import { pipe } from 'fp-ts/lib/pipeable';
import { reader, serverEvent$, matchEvent, ServerEvent, AllServerEvents } from '@marblejs/core';
import { from, Observable, EMPTY } from 'rxjs';
import { mergeMap, take, map, mapTo, mergeMapTo } from 'rxjs/operators';
import { TransportMessage, TransportLayerConnection } from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { jsonTransformer } from '../transport/transport.transformer';
import { MessagingClient, MessagingClientConfig } from './messaging.client.interface';

export const messagingClient = (config: MessagingClientConfig) => {
  const {
    transport,
    options,
    msgTransformer = jsonTransformer,
  } = config;

  const emit = (conn: Promise<TransportLayerConnection>) => <T>(msg: T) =>
    from(conn).pipe(
      mergeMap(c => c.emitMessage(
        c.getChannel(),
        { data: msgTransformer.encode(msg as any) },
      )),
      mapTo(true),
      take(1),
    );

  const send = (conn: Promise<TransportLayerConnection>) => <T, U>(msg: T): Observable<U> =>
    from(conn).pipe(
      mergeMap(c => c.sendMessage(
        c.getChannel(),
        { data: msgTransformer.encode(msg as any) },
      )),
      map(m => m as TransportMessage<Buffer>),
      map(m => msgTransformer.decode(m.data) as U),
      take(1),
    );

  const close = (conn: Promise<TransportLayerConnection>) => () =>
    from(conn).pipe(
      mergeMap(c => c.close()),
      take(1),
    );

  const teardownOnClose$ = (conn: Promise<TransportLayerConnection>) => (event$: Observable<AllServerEvents>) =>
    event$.pipe(
      matchEvent(ServerEvent.close),
      take(1),
      mergeMapTo(conn),
      mergeMap(conn => conn.close()),
    );

  return pipe(reader, R.map(ask => {
    const transportLayer = provideTransportLayer(transport, options);
    const connection = transportLayer.connect({ isConsumer: false });

    pipe(
      ask(serverEvent$),
      O.map(teardownOnClose$(connection)),
      O.getOrElse(() => EMPTY as Observable<any>),
    ).subscribe();

    return {
      emit: emit(connection),
      send: send(connection),
      close: close(connection),
    } as MessagingClient;
  }));
};
