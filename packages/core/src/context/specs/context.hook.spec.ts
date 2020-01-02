import { createContext, registerAll, bindTo, lookup } from '../context.factory';
import { createContextToken } from '../context.token.factory';
import { useContext } from '../context.hook';

describe('#useContext', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation();
  });

  test('injects bound dependency', async () => {
    // given
    const token1 = createContextToken('token_1');
    const token2 = createContextToken('token_2');
    const dependency1 = 'dependency_1';
    const dependency2 = 'dependency_2';

    const context = await registerAll([
      bindTo(token1)(() => dependency1),
      bindTo(token2)(() => dependency2),
    ])(createContext());

    const ask = lookup(context);

    // when
    const resolvedDependency1 = useContext(token1)(ask);
    const resolvedDependency2 = useContext(token2)(ask);

    // then
    expect(resolvedDependency1).toEqual(dependency1);
    expect(resolvedDependency2).toEqual(dependency2);
  });

  test('throws an error if dependency is not bound', async () => {
    // given
    const token1 = createContextToken('token_1');
    const token2 = createContextToken('token_2');
    const dependency1 = 'dependency_1';

    const context = await registerAll([
      bindTo(token1)(() => dependency1),
    ])(createContext());

    const ask = lookup(context);

    // when
    const resolvedDependency1 = () => useContext(token1)(ask);
    const resolvedDependency2 = () => useContext(token2)(ask);

    // then
    expect(resolvedDependency1()).toEqual(dependency1);
    expect(resolvedDependency2).toThrowError();
  });
});
