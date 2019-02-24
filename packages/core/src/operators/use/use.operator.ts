import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { EffectMetadata } from '../../effects/effects.interface';

interface MiddlewareLike<I, O> {
  (i$: Observable<I>, client: any, meta: any): Observable<O>;
}

export const use = <I, O>
  (middleware: MiddlewareLike<I, O>, client?: any, meta?: EffectMetadata) =>
  (source$: Observable<I>) =>
    source$.pipe(
      mergeMap(req => middleware(of(req), client!, meta!) as Observable<O>)
    );
