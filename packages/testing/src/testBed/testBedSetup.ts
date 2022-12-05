import { BoundDependency } from '@marblejs/core';
import * as T from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { TestBedSetupConfig, TestBedSetup } from './testBedSetup.interface';
import { createTestBedContainer } from './testBedContainer';
import { TestBed } from './testBed.interface';

type CreateTestBedSetup = <T extends TestBed>
  (config: TestBedSetupConfig<T>) =>
  (prependDependencies?: readonly BoundDependency<any>[]) =>
  TestBedSetup<T>

export const createTestBedSetup: CreateTestBedSetup = config => prependDependencies => {
  const { dependencies: defaultDependencies, cleanups = [] } = config;

  const { cleanup, register } = createTestBedContainer({ cleanups });

  const useTestBed = async (dependencies: BoundDependency<any>[] = []) => pipe(
    () => config.testBed([
      ...defaultDependencies ?? [],
      ...prependDependencies ?? [],
      ...dependencies
    ]),
    T.chain(register),
  )();

  return {
    useTestBed,
    cleanup,
  };
};
