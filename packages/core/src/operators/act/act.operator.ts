import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/function';
import { Observable, of, defer, isObservable } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { encodeError } from '../../+internal/utils';
import { Event } from '../../event/event.interface';

export function act<
  InputEvent extends Event,
  CallEvent extends Event,
>(
  callFn: (event: InputEvent) => Observable<CallEvent>,
): (source: Observable<InputEvent>) => Observable<CallEvent>;

export function act<
  InputEvent extends Event,
  CallEvent extends Event,
  ErrorEvent extends Event,
>(
  callFn: (event: InputEvent) => Observable<CallEvent>,
  errorFn: (error: any, event: Event) => ErrorEvent | Observable<ErrorEvent>,
): (source: Observable<InputEvent>) => Observable<CallEvent>;

export function act<
  InputEvent extends Event,
  CallEvent extends Event,
  ErrorEvent extends Event,
>(
  callFn: (event: InputEvent) => Observable<CallEvent>,
  errorFn?: (error: any, event: Event) => ErrorEvent | Observable<ErrorEvent>,
) {

  const DEFAULT_ERROR_SUFFIX = '_UNHANDLED_ERROR';

  const getDefaultErrorEvent = (error: any) => (event: Event) => of({
    type: !event.type.includes(DEFAULT_ERROR_SUFFIX)
      ? event.type + DEFAULT_ERROR_SUFFIX
      : event.type,
    error: encodeError(error) ?? true,
    metadata: event.metadata,
  } as ErrorEvent);

  const handleError = (event: InputEvent) => (error: unknown): Observable<any> => pipe(
    O.fromNullable(errorFn),
    O.map(fn => fn(error, event)),
    O.map(res => !isObservable(res) ? of(res) : res),
    O.map(res => res.pipe(map(r => ({ ...r, error: r.error ?? true })))),
    O.getOrElse(() => getDefaultErrorEvent(error)(event)),
  );

  return (source: Observable<InputEvent>): Observable<CallEvent> =>
    source.pipe(
      mergeMap(event => defer(() => {
        try {
          return event.error
            ? handleError(event)(event.error)
            : pipe(
              callFn(event),
              catchError(handleError(event)));
        } catch (error) {
          return handleError(event)(error);
        }
      })),
    );
}
