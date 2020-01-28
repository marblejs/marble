import { Observable, of, EMPTY, defer } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { Event } from '../../event/event.interface';

export const act = <
  InputEvent extends Event,
  CallEvent extends Event,
  ErrorEvent extends Event,
>(
  callFn: (event: InputEvent) => Observable<CallEvent>,
  errorFn?: (error: any, event: InputEvent) => ErrorEvent,
) => (source: Observable<InputEvent>): Observable<CallEvent | ErrorEvent> =>
  source.pipe(
    mergeMap(event => defer(() =>
      callFn(event).pipe(
        catchError(error => errorFn ? of(errorFn(error, event)) : EMPTY),
      ),
    )),
  );
