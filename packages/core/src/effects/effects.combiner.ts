import { Observable, merge } from 'rxjs';
import { Effect, EffectMetadata } from './effects.interface';

export const combineMiddlewares = <T, U>
  (...effects: Effect<T, T, U>[]) =>
  (input$: Observable<T>, meta: EffectMetadata<U>): Observable<T> =>
    effects.reduce((i$, effect) => effect(i$, meta), input$);

export const combineEffects = <T, U, V>
  (...effects: Effect<T, U, V>[]) =>
  (input$: Observable<T>, meta: EffectMetadata<V>): Observable<U> =>
    merge(...effects.map(effect => effect(input$, meta)));
