import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { EffectContext, EffectMiddlewareLike } from '../../effects/effects.interface';

/**
 * @deprecated since version 4.0, apply middlewares direcly to the effect Observable chain
 *
 * `use` operator will be deleted in the next major version (v5.0)
 */
export const use = <I, O>
  (middleware: EffectMiddlewareLike<I, O>, effectContext?: EffectContext<any>) =>
  (source$: Observable<I>): Observable<O> =>
    source$.pipe(
      mergeMap(req => middleware(of(req), effectContext))
    );
