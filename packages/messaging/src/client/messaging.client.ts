import { reader } from '@marblejs/core';
import { from, Observable } from 'rxjs';
import { mergeMap, take, map, tap } from 'rxjs/operators';
import {
  Transport,
  TransportMessage,
  TransportMessageTransformer,
  TransportLayerConnection,
} from '../transport/transport.interface';
import { provideTransportLayer } from '../transport/transport.provider';
import { jsonTransformer } from '../transport/transport.transformer';
import { MessagingClient } from './messaging.client.interface';
import { createUuid } from '@marblejs/core/dist/+internal/utils';

export interface MessagingClientConfig {
  transport?: Transport;
  msgTransformer?: TransportMessageTransformer<any>;
  options?: any; // @TODO
}

export const messagingClient = (config: MessagingClientConfig = {}) => {
  const {
    transport = Transport.TCP,
    msgTransformer = jsonTransformer,
    options = {},
  } = config;

  const emit = (conn$: Observable<TransportLayerConnection>) => <T>(msg: T) =>
    conn$.pipe(
      mergeMap(conn => conn.sendMessage(
        options.queue,
        { data: msgTransformer.encode(msg as any) },
        { type: 'emit' },
      )),
      take(1),
    );

  const publish = (conn$: Observable<TransportLayerConnection>) => <T>(msg: T) =>
    conn$.pipe(
      mergeMap(conn => conn.sendMessage(
        options.queue,
        { data: msgTransformer.encode(msg as any) },
        { type: 'publish' },
      )),
      take(1),
    );

  const send = (conn$: Observable<TransportLayerConnection>) => <T, U>(msg: T): Observable<U> =>
    conn$.pipe(
      mergeMap(conn => conn.sendMessage(
        options.queue,
        { data: msgTransformer.encode(msg as any), correlationId: createUuid() },
        { type: 'send' }
      )),
      map(m => m as TransportMessage<Buffer>),
      map(m => msgTransformer.decode(m.data) as U),
      take(1),
    );

  return reader.map(() => {
    const transportLayer = provideTransportLayer(transport, options);
    const conn$ = from(transportLayer).pipe(
      mergeMap(server => server.connect()),
      tap(conn => conn.consumeResponse()),
    );

    return {
      emit: emit(conn$),
      send: send(conn$),
      publish: publish(conn$),
    } as MessagingClient;
  });
};
