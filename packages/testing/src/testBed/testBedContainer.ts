import * as T from 'fp-ts/lib/Task';
import * as O from 'fp-ts/lib/Option';
import * as A from 'fp-ts/lib/Array';
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

  const register = <T extends TestBed>(testBed: T): T.Task<T> => {
    instances.push(testBed);
    return T.of(testBed);
  }

  const cleanupDependency = (testBed: TestBed) => (dependencyCleanup: DependencyCleanup<any>): T.Task<void> => pipe(
    testBed.ask(dependencyCleanup.token),
    O.map(dependencyCleanup.cleanup),
    O.fold(() => T.of(undefined), res => () => res),
  );

  const cleanupInstance = (testBed: TestBed): T.Task<void> => pipe(
    A.array.map(registeredCleanups, cleanupDependency(testBed)),
    A.array.sequence(T.task),
    T.chain(_ => testBed.finish),
  );

  const cleanup: T.Task<void> = () => pipe(
    A.array.map(instances, cleanupInstance),
    A.array.sequence(T.task),
    T.chain(_ => {
      instances = [];
      return T.of(undefined);
    }),
  )();

  return { cleanup, register };
};
