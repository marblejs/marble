import { BoundDependency, contextFactory, lookup } from '@marblejs/core';
import { TestBedSetupConfig, TestBedSetup } from './testBedSetup.interface';
import { createTestBedContainer } from './testBedContainer';
import { TestBed } from './testBed.interface';

type CreateTestBedSetup = <T extends TestBed>
  (config: TestBedSetupConfig<T>) =>
  (prependDependencies?: readonly BoundDependency<any>[]) =>
  Promise<TestBedSetup<T>>

export const createTestBedSetup: CreateTestBedSetup = config => async (prependDependencies = []) => {
  const { dependencies: defaultDependencies = [], cleanups = [] } = config;

  const { cleanup, register } = createTestBedContainer({ cleanups });

  const boundContext = await contextFactory(
    ...defaultDependencies,
    ...prependDependencies,
  );

  const ask = lookup(boundContext);

  const useTestBed = async (dependencies: BoundDependency<any>[] = []) => {
    const testBed = await config.testBed([
      ...defaultDependencies,
      ...prependDependencies,
      ...dependencies
    ]);

    register(testBed);

    return testBed;
  };

  return {
    ask,
    useTestBed,
    cleanup,
  };
};
