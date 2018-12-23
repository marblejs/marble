import { Observable, from, merge } from 'rxjs';
import { concatMap, last } from 'rxjs/operators';
import { Effect } from './effects.interface';

export const combineMiddlewares = <T, U>
  (...effects: Effect<T, T, U>[]) =>
  (input$: Observable<T>, client: U, meta?: any): Observable<T> =>
    effects.length
      ? from(effects).pipe(
          concatMap(effect => effect(input$, client, meta)),
          last(),
        )
      : input$;

export const combineEffects = <T, U, V>
  (...effects: Effect<T, U, V>[]) =>
  (input$: Observable<T>, client: V, meta?: any): Observable<U> =>
    merge(...effects.map(effect => effect(input$, client, meta)));
