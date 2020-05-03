import { IO } from 'fp-ts/lib/IO';
import { ContextToken } from '@marblejs/core';
import { TestBed } from './testBed.interface';

export type DependencyCleanup<T> = {
  token: ContextToken<T>;
  cleanup: (dependency: T) => Promise<any>;
}

export interface TestBedContainerConfig {
  cleanups?: readonly DependencyCleanup<any>[];
}

export interface TestBedContainer {
  cleanup: IO<Promise<void>>;
  register: (instance: TestBed) => void;
}
