import { Observable, of } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Middleware } from '../../effects/effects.interface';
import { HttpRequest, HttpResponse } from '../../http.interface';
import { InjectionGetter } from '../../server/server.injector';

export const use = <I extends HttpRequest, O extends HttpRequest>
  (middleware: Middleware<I, O>, res?: HttpResponse, inject?: InjectionGetter) =>
  (source$: Observable<I>) =>
    source$.pipe(
      switchMap(req => middleware(of(req), res!, inject!) as Observable<O>)
    );
