import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { EventTypeBase } from '../../http.interface';

export const matchHttpEvent = <T extends EventTypeBase>
  (eventToMatch: T) =>
  (source$: Observable<EventTypeBase>) =>
    source$.pipe(
      filter(event => event.type === eventToMatch.type),
      map(event => event.data as NonNullable<T['data']>),
    );
