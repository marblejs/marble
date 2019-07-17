import { reader, serverEvent$, matchEvent, ServerEvent } from '@marblejs/core';
import { from, Observable, EMPTY } from 'rxjs';
import { mergeMap, take, map, mapTo, mergeMapTo } from 'rxjs/operators';
import { TransportMessage, TransportLayerConnection } from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { jsonTransformer } from '../transport/transport.transformer';
import { MessagingClient, MessagingClientConfig } from './messaging.client.interface';
import { createUuid } from '@marblejs/core/dist/+internal/utils';

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
        { data: msgTransformer.encode(msg as any), correlationId: createUuid() },
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

  return reader.map(ask => {
    const transportLayer = provideTransportLayer(transport, options);
    const connection = transportLayer.connect();

    ask(serverEvent$).map(serverEvent$ =>
      serverEvent$.pipe(
        matchEvent(ServerEvent.close),
        take(1),
        mergeMapTo(connection),
        mergeMap(conn => conn.close()),
      ),
    ).getOrElse(EMPTY).subscribe();

    return {
      emit: emit(connection),
      send: send(connection),
      close: close(connection),
    } as MessagingClient;
  });
};
