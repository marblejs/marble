import { Observable, SchedulerLike } from 'rxjs';
import { ContextReader } from '../context/context.factory';

export interface EffectLike {
  (input$: Observable<any>, ...args: any[]): Observable<any>;
}

export interface Effect<I, O, C, E extends Error = Error> {
  (input$: Observable<I>, client: C, meta: EffectMetadata<E>): Observable<O>;
}

export interface EffectMetadata<T extends Error = Error> {
  ask: ContextReader;
  scheduler: SchedulerLike;
  error?: T;
  [key: string]: any;
}
