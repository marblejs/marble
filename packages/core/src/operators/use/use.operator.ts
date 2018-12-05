import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Middleware } from '../../effects/effects.interface';
import { HttpRequest, HttpResponse } from '../../http.interface';

export const use = <T extends HttpRequest>
  (middleware: Middleware<HttpRequest, T>, res?: HttpResponse) =>
  (source$: Observable<HttpRequest>): Observable<T> =>
    source$.pipe(
      switchMap(req => middleware(of(req), res!, {}))
    );
