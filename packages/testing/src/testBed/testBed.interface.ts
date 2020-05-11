import { Task } from 'fp-ts/lib/Task';
import { ContextProvider, BoundDependency } from '@marblejs/core';

export enum TestBedType {
  HTTP,
  MESSAGING,
  WEBSOCKETS,
}

export interface TestBed {
  type: TestBedType;
  ask: ContextProvider;
  finish: Task<void>;
}

export type TestBedFactory<T> = (dependencies?: BoundDependency<any>[]) => Promise<T>
