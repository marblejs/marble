import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';

interface MiddlewareLike<I, O> {
  (i$: Observable<I>, client: any, meta: any): Observable<O>;
}

export const use = <I, O>
  (middleware: MiddlewareLike<I, O>, client?: any, meta?: any) =>
  (source$: Observable<I>) =>
    source$.pipe(
      mergeMap(req => middleware(of(req), client!, meta!) as Observable<O>)
    );
