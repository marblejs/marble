import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { Observable, of, defer, isObservable } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
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
  errorFn: (error: any, event: InputEvent) => ErrorEvent | Observable<ErrorEvent>,
): (source: Observable<InputEvent>) => Observable<CallEvent | ErrorEvent>;

export function act<
  InputEvent extends Event,
  CallEvent extends Event,
  ErrorEvent extends Event,
>(
  callFn: (event: InputEvent) => Observable<CallEvent>,
  errorFn?: (error: any, event: InputEvent) => ErrorEvent | Observable<ErrorEvent>,
) {

  const getDefaultErrorEvent = (error: any) => (event: Event) => of({
    type: event.type,
    error: { name: error.name, message: error.message, data: error.data },
    metadata: event.metadata,
  } as ErrorEvent);

  return (source: Observable<InputEvent>): Observable<CallEvent | ErrorEvent> =>
    source.pipe(
      mergeMap(event => defer(() =>
        callFn(event).pipe(
          catchError(error => pipe(
            O.fromNullable(errorFn),
            O.map(fn => fn(error, event)),
            O.map(res => !isObservable(res) ? of(res) : res),
            O.getOrElse(() => getDefaultErrorEvent(error)(event)),
          )),
        ),
      )),
    );
}
