import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { EffectMetadata, EffectMiddlewareLike } from '../../effects/effects.interface';

export const use = <I, O>
  (middleware: EffectMiddlewareLike<I, O>, meta?: EffectMetadata<any>) =>
  (source$: Observable<I>): Observable<O> =>
    source$.pipe(
      mergeMap(req => middleware(of(req),  meta))
    );
