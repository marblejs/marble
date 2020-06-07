import { Options } from 'amqplib';
import { NamedError } from '@marblejs/core/dist/+internal/utils';
import { Transport } from '../transport.interface';

export interface AmqpStrategy {
  transport: Transport.AMQP;
  options: AmqpStrategyOptions;
}

export interface AmqpStrategyOptions {
  host: string;
  queue: string;
  queueOptions?: Options.AssertQueue;
  prefetchCount?: number;
  expectAck?: boolean;
  timeout?: number;
}

export enum AmqpConnectionStatus {
  CONNECTED = 'CONNECTED',
  CHANNEL_CONNECTED = 'CHANNEL_CONNECTED',
  CONNECTION_LOST = 'CONNECTION_LOST',
  CHANNEL_CONNECTION_LOST = 'CHANNEL_CONNECTION_LOST',
}

export enum AmqpErrorType {
  CANNOT_SET_ACK_FOR_NON_CONSUMER_CONNECTION = 'AmqpCannotSetExpectAckForNonConsumerConnection',
}

export class AmqpCannotSetExpectAckForNonConsumerConnection extends NamedError {
  constructor() {
    super(
      AmqpErrorType.CANNOT_SET_ACK_FOR_NON_CONSUMER_CONNECTION,
      `Non consumer connections cannot set "expectAck" attribute`,
    );
  }
}
