import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Effect } from '../../effects/effects.interface';
import { HttpRequest, HttpResponse } from '../../http.interface';

export const use =
  (middleware: Effect<HttpRequest>, res?: HttpResponse) =>
  (source$: Observable<HttpRequest>) =>
    source$.pipe(
      switchMap(req => middleware(of(req), res!, {}))
    );
