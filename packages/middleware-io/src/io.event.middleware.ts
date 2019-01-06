import { WebSocketEvent, WebSocketError } from '@marblejs/websockets';
import { Observable, of, throwError } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { Schema, ValidatorOptions, validator$ } from './io.middleware';
import { IOError } from './io.error';

export const eventValidator$ = <U extends Schema, T = WebSocketEvent>
  (schema: U, options: ValidatorOptions = {}) => {
    const eventValidator$ = validator$(schema, options);

    return (event$: Observable<T>) =>
      event$.pipe(
        mergeMap(event => eventValidator$(of(event)).pipe(
          map(validatedEvent => event as T extends WebSocketEvent
            ? WebSocketEvent<typeof validatedEvent['payload']>
            : typeof validatedEvent
          ),
          catchError((error: IOError) => throwError(
            new WebSocketError(event as any, error.message, error.data),
          )),
        )),
      );
  };
