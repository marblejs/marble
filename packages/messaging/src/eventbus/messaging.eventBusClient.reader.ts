import { createContextToken, createReader, useContext, LoggerToken, LoggerTag, LoggerLevel } from '@marblejs/core';
import { MessagingClient } from '../client/messaging.client';

export interface EventBusClient extends MessagingClient {}

export const EventBusClientToken = createContextToken<EventBusClient>('EventBusClient');

/**
 * `EventBusClient` has to be registered eagerly after main `EventBus`
 * @returns asynchronous reader of `EventBus`
 * @since v3.0
 */
export const EventBusClient = createReader(ask => {
  const logger = useContext(LoggerToken)(ask);

  const logWarning = logger({
    tag: LoggerTag.EVENT_BUS,
    level: LoggerLevel.WARN,
    type: 'eventBusClient',
    message: '"EventBus" requires to be registered eagerly before "EventBusClient" reader.',
  });

  logWarning();
});

/**
 * An alias for `EventBusClient`
 *
 * @deprecated since version `v4.0`. Use `EventBusClient` instead.
 * Will be removed in version `v5.0`
 */
export const eventBusClient = EventBusClient;
