import { Observable, SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export interface EffectLike {
  (input$: Observable<any>, ...args: any[]): Observable<any>;
}

export interface EffectMiddlewareLike<I, O> {
  (i$: Observable<I>, ...args: any[]): Observable<O>;
}

export interface Effect<I, O, Client> {
  (input$: Observable<I>, ctx: EffectContext<Client>): Observable<O>;
}

export interface EffectContext<T, U extends SchedulerLike = SchedulerLike> {
  ask: ContextProvider;
  scheduler: U;
  client: T;
}
