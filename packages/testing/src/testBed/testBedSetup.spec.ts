import { createContextToken, httpListener, bindTo, useContext } from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { createHttpTestBed } from './http/http.testBed';
import { createTestBedSetup } from './testBedSetup';

describe('#createTestBedSetup - HTTP', () => {
  const createDependencyObject = () => ({
    token: createContextToken<string>(),
    value: createUuid(),
  });

  const testBed = createHttpTestBed({ listener: httpListener() });

  const dependency1 = createDependencyObject();
  const dependency2 = createDependencyObject();
  const dependency3 = createDependencyObject();

  const dependencies = [bindTo(dependency1.token)(() => dependency1.value)];
  const prependDependencies = [bindTo(dependency2.token)(() => dependency2.value)];
  const customDependencies = [bindTo(dependency3.token)(() => dependency3.value)];

  const useTestBedSetup = createTestBedSetup({ testBed, dependencies });

  test('testBed initialized with useTestBed has access to default dependencies', async () => {
    const { useTestBed, cleanup } = useTestBedSetup(prependDependencies);
    const testBed = await useTestBed(customDependencies);
    const dependency = useContext(dependency1.token)(testBed.ask);

    expect(dependency).toEqual(dependency1.value);

    await cleanup();
  });

  test('testBed initialized with useTestBed has access to prepend dependencies', async () => {
    const { useTestBed, cleanup } = useTestBedSetup(prependDependencies);
    const testBed = await useTestBed(customDependencies);
    const dependency = useContext(dependency2.token)(testBed.ask);

    expect(dependency).toEqual(dependency2.value);

    await cleanup();
  });

  test('testBed initialized with useTestBed has access to custom dependencies', async () => {
    const { useTestBed, cleanup } = useTestBedSetup(prependDependencies);
    const testBed = await useTestBed(customDependencies);
    const dependency = useContext(dependency3.token)(testBed.ask);

    expect(dependency).toEqual(dependency3.value);

    await cleanup();
  });

  test('#useTestBedSetup can override subset of dependencies', async () => {
    const newValue = createUuid();
    const { useTestBed, cleanup } = useTestBedSetup([
      bindTo(dependency1.token)(() => newValue),
    ]);

    const testBed = await useTestBed();

    expect(useContext(dependency1.token)(testBed.ask)).toEqual(newValue);

    await cleanup();
  });

  test('#useTestBed can override subset of dependencies', async () => {
    const newValue = createUuid();
    const { useTestBed, cleanup } = useTestBedSetup(prependDependencies);

    const testBed = await useTestBed([
      bindTo(dependency2.token)(() => newValue),
    ]);

    expect(useContext(dependency2.token)(testBed.ask)).toEqual(newValue);

    await cleanup();
  });
});
