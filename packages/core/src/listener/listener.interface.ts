import { IO } from 'fp-ts/lib/IO';
import { Reader } from 'fp-ts/lib/Reader';
import { Effect } from '../effects/effects.interface';
import { Context, BoundDependency } from '../context/context';

export interface ListenerConfig<T = any> {
  effects?: any[];
  middlewares?: any[];
  error$?: Effect<any, any, T>;
  output$?: Effect<any, any, T>;
}

export type ListenerHandler = (...args: any[]) => void;

export interface Listener<
  T extends ListenerConfig = ListenerConfig,
  U extends ListenerHandler = ListenerHandler,
> {
  (config?: T): Reader<Context, U>;
}

export interface ServerIO<T> extends IO<Promise<T>> {
  context: Context;
}

export interface ServerConfig<
  T extends Effect<any, any, any>,
  U extends ReturnType<Listener> = ReturnType<Listener>,
> {
  event$?: T;
  listener: U;
  dependencies?: BoundDependency<any>[];
}
