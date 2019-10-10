import { Observable, SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export interface EffectLike {
  (input$: Observable<any>, ...args: any[]): Observable<any>;
}

export interface Effect<I, O, Client> {
  (input$: Observable<I>, client: Client, meta: EffectMetadata): Observable<O>;
}

export interface EffectMetadata {
  ask: ContextProvider;
  scheduler: SchedulerLike;
  [key: string]: any;
}
