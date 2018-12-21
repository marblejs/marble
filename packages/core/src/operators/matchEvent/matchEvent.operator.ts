import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { MarbleEvent } from '../../http.interface';

export const matchEvent = <T extends MarbleEvent>
  (eventToMatch: T) =>
  (source$: Observable<MarbleEvent>) =>
    source$.pipe(
      filter(event => event.type === eventToMatch.type),
      map(event => event.data as NonNullable<T['data']>),
    );
