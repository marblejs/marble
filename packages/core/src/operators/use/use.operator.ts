import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Middleware } from '../../effects/effects.interface';
import { HttpRequest, HttpResponse } from '../../http.interface';

export const use = <T, U, V>
  (middleware: Middleware<T, U, V>, res?: HttpResponse) =>
  (source$: Observable<HttpRequest>): Observable<HttpRequest<T, U, V>> =>
    source$.pipe(
      switchMap(req => middleware(of(req), res!, {}))
    );
