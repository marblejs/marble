import { Observable, SchedulerLike } from 'rxjs';
import { InjectorGetter } from '../server/server.injector';

export interface EffectLike {
  (input$: Observable<any>, ...args: any[]): Observable<any>;
}

export interface Effect<I, O, C, E extends Error = Error> {
  (input$: Observable<I>, client: C, meta: EffectMetadata<E>): Observable<O>;
}

export interface EffectMetadata<T extends Error = Error> {
  inject: InjectorGetter;
  scheduler: SchedulerLike;
  error?: T;
  [key: string]: any;
}
