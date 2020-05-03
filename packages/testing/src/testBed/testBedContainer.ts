import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { EventBusClientToken } from '@marblejs/messaging';
import { TestBed } from './testBed.interface';
import { TestBedContainer, TestBedContainerConfig, DependencyCleanup } from './testBedContainer.interface';

export const createTestBedContainer = (config?: TestBedContainerConfig): TestBedContainer => {
  let instances: TestBed[] = [];

  const eventBusClientCleanup: DependencyCleanup<typeof EventBusClientToken['_T']> = {
    token: EventBusClientToken,
    cleanup: client => client.close(),
  };

  const registeredCleanups = [
    eventBusClientCleanup,
    ...config?.cleanups ?? [],
  ];

  const register = (testBed: TestBed) => {
    instances.push(testBed);
  }

  const cleanupDependency = (testBed: TestBed) => (dependencyCleanup: DependencyCleanup<any>): Promise<void> =>
    pipe(
      testBed.ask(dependencyCleanup.token),
      O.map(dependencyCleanup.cleanup),
      O.getOrElse(() => Promise.resolve()),
    );

  const cleanupInstance = async (testBed: TestBed): Promise<void> => {
    await Promise.all(registeredCleanups.map(cleanupDependency(testBed)))
    await testBed.finish();
  }

  const cleanup = async (): Promise<void> => {
    await Promise.all(instances.map(cleanupInstance));
    instances = [];
  }

  return { cleanup, register };
};
