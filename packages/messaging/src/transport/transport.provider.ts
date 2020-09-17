import * as E from 'fp-ts/lib/Either';
import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Context, lookup } from '@marblejs/core';
import { EventBusToken } from '../eventbus/messaging.eventBus.reader';
import { Transport, TransportLayer, isTransportLayerConnection } from './transport.interface';
import { createAmqpStrategy } from './strategies/amqp.strategy';
import { createRedisStrategy } from './strategies/redis.strategy';

export const provideLocalTransportLayer = (context?: Context): E.Either<Error, TransportLayer<Transport>> =>
  pipe(
    O.fromNullable(context),
    O.chain(ctx => lookup(ctx)(EventBusToken)),
    E.fromOption(() => new Error('Cannot provide EventBus transport layer if it is not registered')),
    E.chain(dependency => !isTransportLayerConnection(dependency)
      ? E.left(new Error('Cannot provide non-evaluated EventBus transport layer'))
      : E.right({
        connect: () => Promise.resolve(dependency),
        config: dependency.config.raw,
        type: dependency.type,
      }),
    ));

export const provideTransportLayer = <T extends Transport>(transport: T, transportOptions: any = {}) => (context?: Context): E.Either<Error, TransportLayer<T>> => {
  switch (transport) {
    case Transport.AMQP:
      return E.right(createAmqpStrategy(transportOptions) as TransportLayer<T>);
    case Transport.REDIS:
      return E.right(createRedisStrategy(transportOptions) as TransportLayer<T>);
    case Transport.LOCAL:
      return provideLocalTransportLayer(context) as E.Either<Error, TransportLayer<T>>;
    default:
      return E.left(new Error(`Unsupported transport type: "${transport}"`));
  }
};
