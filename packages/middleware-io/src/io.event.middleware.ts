import { Event, EventError, ValidatedEvent, isEventCodec } from '@marblejs/core';
import { Observable, of, throwError, isObservable } from 'rxjs';
import { pipe } from 'fp-ts/lib/pipeable';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { Schema, ValidatorOptions, validator$ } from './io.middleware';
import { IOError } from './io.error';

type ValidationResult<U extends Schema> =  U['_A'] extends { type: string; payload: any }
  ? ValidatedEvent<U['_A']['payload'], U['_A']['type']>
  : ValidatedEvent<U['_A']>

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
      isEventCodec(schema)
        ? validateByEventSchema(event)
        : validateByPayloadSchema(event),
      catchError((error: IOError) => throwError(() =>
        new EventError(event, error.message, error.data),
      )),
    ) as Observable<ValidationResult<U>>;

  return (input: Observable<Event> | Event) =>
    isObservable(input)
      ? input.pipe(mergeMap(validate))
      : validate(input);
};
