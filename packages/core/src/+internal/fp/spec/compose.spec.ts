import { compose } from '../compose';

describe('#compose', () => {
  test('works correctly with more than 2 functions', () => {
    // given
    const add = (a: number) => (b: number) => b + a;
    const substract = (a: number) => (b: number) => b - a;
    const multiply = (a: number) => (b: number) => b * a;

    // when
    const result = compose(
      multiply(2),
      substract(2),
      add(1),
    )(10);

    // then
    expect(result).toEqual(18);
  });

  test('works correctly with 1 function', () => {
    // given
    const add = (a: number) => (b: number) => b + a;

    // when
    const result = compose(
      add(1),
    )(10);

    // then
    expect(result).toEqual(11);
  });
});
