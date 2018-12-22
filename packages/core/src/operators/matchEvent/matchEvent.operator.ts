import { Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { ServerEvent } from '../../http.interface';

export const matchEvent = <T extends ServerEvent>
  (eventToMatch: T) =>
  (source$: Observable<ServerEvent>) =>
    source$.pipe(
      filter(event => event.type === eventToMatch.type),
      map(event => event.data as NonNullable<T['data']>),
    );
