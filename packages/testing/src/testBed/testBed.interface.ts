import { IO } from 'fp-ts/lib/IO';
import { ContextProvider, BoundDependency } from '@marblejs/core';

export enum TestBedType {
  HTTP,
  MESSAGING,
  WEBSOCKETS,
}

export interface TestBed {
  type: TestBedType;
  ask: ContextProvider;
  finish: IO<Promise<void>>;
}

export type TestBedFactory<T> = (dependencies?: BoundDependency<any>[]) => Promise<T>
