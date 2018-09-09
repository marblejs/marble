import { Maybe } from '../maybe';

const increment = (v: number) => v + 1;

describe('Maybe monad', () => {

  describe('#valueOr', () => {
    test('returns a defined value if Some', () => {
      const value = Maybe.of(2)
        .valueOr(0);

      expect(value).toEqual(2);
    });

    test('returns provided default if None', () => {
      const value = Maybe.of<number>(undefined)
        .valueOr(0);

      expect(value).toEqual(0);
    });
  });

  describe('#valueOrCompute', () => {
    test('returns a defined value if Some', () => {
      const value = Maybe.of(2)
        .valueOrCompute(() => 3);

      expect(value).toEqual(2);
    });

    test('returns provided default if None', () => {
      const value = Maybe.of<number>(undefined)
        .valueOrCompute(() => 3);

      expect(value).toEqual(3);
    });
  });


  describe('#valueOrThrow', () => {
    test('returns value if is Some', () => {
      const value = () => Maybe.of(2)
        .valueOrThrow();

      expect(() => value()).not.toThrowError();
      expect(value()).toEqual(2);
    });

    test('throws default error if None', () => {
      const value = () => Maybe.of<number>(undefined)
        .valueOrThrow();

      expect(() => value()).toThrowError(new Error('No value is available'));
    });

    test('throws defined error if None', () => {
      const value = () => Maybe.of<number>(undefined)
        .valueOrThrow(new Error('test'));

      expect(() => value()).toThrowError(new Error('test'));
    });
  });

  describe('#map', () => {
    test('maps value if Some', () => {
      const value = Maybe.of(2)
        .map(increment)
        .valueOr(0);

      expect(value).toEqual(3);
    });

    test('returns default if None', () => {
      const value = Maybe.of<number>(undefined)
        .map(increment)
        .valueOr(0);

      expect(value).toEqual(0);
    });
  });

  describe('#flatMap', () => {
    test('flattens Some monad and returns value', () => {
      const value = Maybe.of(2)
        .flatMap(v => Maybe.of('test'))
        .valueOr('');

      expect(value).toEqual('test');
    });

    test('flattens None monad and returns default', () => {
      const value = Maybe.of<number>(undefined)
        .flatMap(v => Maybe.of('test'))
        .valueOr('test');

      expect(value).toEqual('test');
    });
  });

  describe('#caseOf', () => {
    test('matches Some monad and returns value', () => {
      const value = Maybe.of(2)
        .caseOf({
          some: v => v + 1,
          none: () => 0,
        });

      expect(value).toEqual(3);
    });

    test('matches None monad and default value', () => {
      const value = Maybe.of<number>(undefined)
        .caseOf({
          some: v => v + 1,
          none: () => 0,
        });

      expect(value).toEqual(0);
    });
  });
});
