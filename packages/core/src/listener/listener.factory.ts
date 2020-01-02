import { flow } from 'fp-ts/lib/function';
import { createReader, ReaderHandler } from '../context/context.reader.factory';
import { ListenerConfig, Listener, ListenerHandler } from './listener.interface';

export const createListener = <T extends ListenerConfig, U extends ListenerHandler>(
  fn: (config?: T) => ReaderHandler<U>
): Listener<T, U> => flow(fn, createReader);
