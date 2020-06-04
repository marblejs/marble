import { Observable, merge } from 'rxjs';
import { share } from 'rxjs/operators';
import { Effect, EffectContext } from './effects.interface';

export const combineMiddlewares = <T, U>
  (...effects: (Effect<T, T, U> | undefined)[]) =>
  (input$: Observable<T>, ctx: EffectContext<U>): Observable<T> =>
    effects.reduce((i$, effect) => effect ? effect(i$, ctx) : i$, input$);

export const combineEffects = <T, U, V>
  (...effects: Effect<T, U, V>[]) =>
  (input$: Observable<T>, ctx: EffectContext<V>): Observable<U> =>
    merge(...effects.map(effect => effect(input$, ctx))).pipe(share());
