import { flow } from 'fp-ts/lib/function';
import { createReader, ReaderHandler } from '../context/context.reader.factory';
import { ListenerConfig, Listener } from './listener.interface';

export type ListenerHandler<T extends ListenerConfig, U> =
  (config?: T) => ReaderHandler<U>;

export const createListener = <T extends ListenerConfig, U>(
  handler: ListenerHandler<T, U>
): Listener<T, U> => flow(handler, createReader);
