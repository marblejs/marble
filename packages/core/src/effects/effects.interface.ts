import { Observable, SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export interface EffectLike {
  (input$: Observable<any>, ...args: any[]): Observable<any>;
}

export interface Effect<I, O, C, E extends Error = Error> {
  (input$: Observable<I>, client: C, meta: EffectMetadata<E>): Observable<O>;
}

export interface EffectMetadata<T extends Error = Error> {
  ask: ContextProvider;
  scheduler: SchedulerLike;
  error?: T;
  [key: string]: any;
}
