import { Reader } from 'fp-ts/lib/Reader';
import { Effect } from '../effects/effects.interface';
import { Context } from '../context/context.factory';

export interface ListenerConfig<T = any> {
  effects?: any[];
  middlewares?: any[];
  error$?: Effect<any, any, T>;
  output$?: Effect<any, any, T>;
}

export interface Listener<T extends ListenerConfig, U> {
  (config: T): Reader<Context, U>;
}
