import { Observable, of } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { EffectContext, EffectMiddlewareLike } from '../../effects/effects.interface';

export const use = <I, O>
  (middleware: EffectMiddlewareLike<I, O>, effectContext?: EffectContext<any>) =>
  (source$: Observable<I>): Observable<O> =>
    source$.pipe(
      mergeMap(req => middleware(of(req), effectContext))
    );
