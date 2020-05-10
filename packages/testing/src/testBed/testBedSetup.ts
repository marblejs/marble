import { BoundDependency } from '@marblejs/core';
import { TestBedSetupConfig, TestBedSetup } from './testBedSetup.interface';
import { createTestBedContainer } from './testBedContainer';
import { TestBed } from './testBed.interface';

type CreateTestBedSetup = <T extends TestBed>
  (config: TestBedSetupConfig<T>) =>
  (prependDependencies?: readonly BoundDependency<any>[]) =>
  TestBedSetup<T>

export const createTestBedSetup: CreateTestBedSetup = config => (prependDependencies = []) => {
  const { dependencies: defaultDependencies = [], cleanups = [] } = config;

  const { cleanup, register } = createTestBedContainer({ cleanups });

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
    useTestBed,
    cleanup,
  };
};
