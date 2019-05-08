import { Observable, SchedulerLike } from 'rxjs';
import { ContextProvider } from '../context/context.factory';

export interface EffectLike {
  (input$: Observable<any>, ...args: any[]): Observable<any>;
}

export interface Effect<I, O, Client, Err extends Error = Error, Initiator = any> {
  (input$: Observable<I>, client: Client, meta: EffectMetadata<Err, Initiator>): Observable<O>;
}

export interface EffectMetadata<Err extends Error = Error, Initiator = any> {
  ask: ContextProvider;
  scheduler: SchedulerLike;
  error?: Err;
  initiator?: Initiator;
  [key: string]: any;
}
