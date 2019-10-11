import { Observable, merge } from 'rxjs';
import { Effect, EffectContext } from './effects.interface';

export const combineMiddlewares = <T, U>
  (...effects: Effect<T, T, U>[]) =>
  (input$: Observable<T>, ctx: EffectContext<U>): Observable<T> =>
    effects.reduce((i$, effect) => effect(i$, ctx), input$);

export const combineEffects = <T, U, V>
  (...effects: Effect<T, U, V>[]) =>
  (input$: Observable<T>, ctx: EffectContext<V>): Observable<U> =>
    merge(...effects.map(effect => effect(input$, ctx)));
