import { Event, EventError, ValidatedEvent } from '@marblejs/core';
import { Observable, of, throwError } from 'rxjs';
import { pipe } from 'fp-ts/lib/pipeable';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { Schema, ValidatorOptions, validator$ } from './io.middleware';
import { IOError } from './io.error';

export const eventValidator$ = <U extends Schema>(schema: U, options?: ValidatorOptions) => {
  const eventValidator$ = validator$(schema, options);

  const validateByEventSchema = (incomingEvent: Event) =>
    pipe(
      of(incomingEvent),
      eventValidator$,
      map(decodedEvent => ({ ...incomingEvent, ...decodedEvent }) as ValidatedEvent),
    );

  const validateByPayloadSchema = (incomingEvent: Event) =>
    pipe(
      of(incomingEvent.payload),
      eventValidator$,
      map(payload => ({ ...incomingEvent, payload }) as ValidatedEvent),
    );

  const validate = (event: Event) =>
    pipe(
      schema.name === 'EventSchema'
        ? validateByEventSchema(event)
        : validateByPayloadSchema(event),
      catchError((error: IOError) => throwError(
        new EventError(event, error.message, error.data),
      )),
    ) as U['_A'] extends { type: string; payload: any }
      ? Observable<ValidatedEvent<U['_A']['payload'], U['_A']['type']>>
      : Observable<ValidatedEvent<U['_A']>>;

  return (event$: Observable<Event>) =>
    event$.pipe(mergeMap(validate));
};
