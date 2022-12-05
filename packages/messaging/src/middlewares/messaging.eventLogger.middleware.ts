import { pipe } from 'fp-ts/lib/function';
import { tap } from 'rxjs/operators';
import { useContext, LoggerToken, LoggerLevel, Event, EventError, isEventError } from '@marblejs/core';
import { NamedError } from '@marblejs/core/dist/+internal/utils';
import { MsgMiddlewareEffect, MsgOutputEffect } from '../effects/messaging.effects.interface';
import { TransportLayerToken } from '../server/messaging.server.tokens';

/**
 * Logs incoming events
 *
 * @since v3.0.0
 * @param event$ - event stream
 * @param ctx - EffectContext
 */
export const inputLogger$: MsgMiddlewareEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);
  const tag = transportLayer.config.channel;

  return event$.pipe(
    tap(event => pipe(
      getIncomingMessageForEvent(event),
      message => logger({
        tag, message,
        level: LoggerLevel.INFO,
        type: 'EVENT_IN',
        data: { payload: event.payload },
      }),
    )()),
  );
};

/**
 * Logs outgoing events
 *
 * @since v3.0.0
 * @param event$ - event stream
 * @param ctx - EffectContext
 */
export const outputLogger$: MsgOutputEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);
  const tag = transportLayer.config.channel;

  return event$.pipe(
    tap(event => pipe(
      event.error
        ? getErrorMessageForEvent(event)
        : getOutgoingMessageForEvent(event),
      message => logger({
        tag, message,
        level: event.error ? LoggerLevel.ERROR : LoggerLevel.INFO,
        type: 'EVENT_OUT',
        data: { payload: event.payload },
      }),
    )()),
  );
};

/**
 * Logs server exceptions
 *
 * @since v3.0.0
 * @param event$ - event stream
 * @param ctx - EffectContext
 */
export const exceptionLogger$: MsgMiddlewareEffect = (event$, ctx) => {
  const logger = useContext(LoggerToken)(ctx.ask);
  const transportLayer = useContext(TransportLayerToken)(ctx.ask);
  const tag = transportLayer.config.channel;

  return event$.pipe(
    tap(event => pipe(
      getErrorMessageForEvent(event),
      message => logger({ tag, message, level: LoggerLevel.ERROR, type: 'ERROR' }),
    )()),
  );
};

const getValidationErrorMessage = (event: Event<unknown, EventError>): string => {
  const error = event.error;
  const correlationId = event.metadata?.correlationId || 'UNKNOWN_CORRELATION_ID';
  const parsedError = error ? JSON.stringify(error.data) : 'UNKNOWN_ERROR';
  const eventType = event.type.replace('_UNHANDLED_ERROR', '');
  return correlationId
    ? `Received invalid event "${eventType}" (${correlationId}) with error: ${parsedError}`
    : `Received invalid event "${eventType}" with error: ${parsedError}`;
};

const getGenericErrorMessage = (event: Event<unknown, NamedError>): string => {
  const error = event.error;
  const name = error?.name;
  const message = error?.message || '-';
  const eventType = event.type;
  return name
    ? `"${name}: ${message}" for event "${eventType}"`
    : `Unknown error "${JSON.stringify(error)}" for event "${eventType}"`;
};

const getOutgoingMessageForEvent = ({ type, metadata }: Event): string => {
  const replyTo = metadata?.replyTo;
  const correlationId = metadata?.correlationId;
  return replyTo && correlationId
    ? `${type}, id: ${correlationId} and sent to "${replyTo}"`
    : correlationId
      ? `${type}, id: ${correlationId}`
      : type;
};

const getIncomingMessageForEvent = ({ type, metadata }: Event): string => {
  const id = metadata?.correlationId;
  return id ? `${type}, id: ${id}` : type;
};

const getErrorMessageForEvent = (event: Event<unknown>): string =>
  isEventError(event.error)
    ? getValidationErrorMessage(event)
    : getGenericErrorMessage(event);
