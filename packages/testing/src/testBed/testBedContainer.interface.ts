import { Task } from 'fp-ts/lib/Task';
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
  cleanup: Task<void>;
  register: <T extends TestBed>(instance: T) => Task<T>;
}
