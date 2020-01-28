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

  const getDefaultErrorEvent = (error: Error) => (event: Event) => of({
    type: event.type,
    error: { name: error.name, message: error.message },
  } as ErrorEvent);


  return (source: Observable<InputEvent>): Observable<CallEvent | ErrorEvent> =>
    source.pipe(
      mergeMap(event => defer(() =>
        callFn(event).pipe(
          catchError(error => {
            if (!errorFn) return getDefaultErrorEvent(error)(event);

            const result = errorFn(error, event);
            return !isObservable(result)
              ? of(result)
              : result;
          }),
        ),
      )),
    );
}
