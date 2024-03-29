import { bindEagerlyTo, useContext, bindTo, createContextToken } from '@marblejs/core';
import { httpListener } from '@marblejs/http';
import { EventBusClientToken, EventBusClient, EventBusToken, EventBus, messagingListener } from '@marblejs/messaging';
import { createHttpTestBed } from './http/http.testBed';
import { createTestBedSetup } from './testBedSetup';
import { DependencyCleanup } from './testBedContainer.interface';

type CustomDependency = { close: jest.Mock };

describe('#createTestBedSetup cleanup container', () => {
  const testBed = createHttpTestBed({
    listener: httpListener(),
  });

  const dependencies = [
    bindEagerlyTo(EventBusToken)(EventBus({ listener: messagingListener() })),
    bindEagerlyTo(EventBusClientToken)(EventBusClient),
  ];

  const customDependencyToken = createContextToken<CustomDependency>();
  const customDependencyBound = bindTo(customDependencyToken)(() => ({ close: jest.fn() }));
  const customDependencyCleanup: DependencyCleanup<CustomDependency> = {
    token: customDependencyToken,
    cleanup: dep => dep.close(),
  };

  const useTestBedSetup = createTestBedSetup({
    testBed,
    dependencies,
    cleanups: [customDependencyCleanup],
  });

  test('automatically closes bound EventBus', async () => {
    const { useTestBed, cleanup } = useTestBedSetup();
    const testBed = await useTestBed();

    const eventBus = useContext(EventBusToken)(testBed.ask);
    const eventBusSpy = jest.spyOn(eventBus, 'close');

    const eventBusClient = useContext(EventBusClientToken)(testBed.ask);
    const eventBusClientSpy = jest.spyOn(eventBusClient, 'close');

    await cleanup();

    expect(eventBusSpy).toHaveBeenCalledTimes(1);
    expect(eventBusClientSpy).toHaveBeenCalledTimes(1);
  });

  test('automatically cleanups custom dependency', async () => {
    const { useTestBed, cleanup } = useTestBedSetup();
    const testBed = await useTestBed([customDependencyBound]);

    const customDependency = useContext(customDependencyToken)(testBed.ask);
    const customDependencySpy = jest.spyOn(customDependency, 'close');

    await cleanup();

    expect(customDependencySpy).toHaveBeenCalledTimes(1);
  });
});
