import { createContextToken, createReader, useContext, LoggerToken, LoggerTag, LoggerLevel } from '@marblejs/core';
import { MessagingClient } from '../client/messaging.client.interface';

export interface EventBusClient extends MessagingClient {}

export const EventBusClientToken = createContextToken<EventBusClient>('EventBusClient');

export const eventBusClient = createReader(ask => {
  const logger = useContext(LoggerToken)(ask);

  const logWarning = logger({
    tag: LoggerTag.EVENT_BUS,
    level: LoggerLevel.WARN,
    type: 'eventBusClient',
    message: '"EventBusClient" requires to be registered eagerly before main "EventBus" reader.',
  });

  logWarning();
});
