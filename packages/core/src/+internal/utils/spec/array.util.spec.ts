import { getArrayFromEnum, getHead, filterArray, mapArray } from '../array.util';

describe('Array util', () => {
  test('#getArrayFromEnum returns array from simple enumerable', () => {
    // given
    enum Test {
      TEST_1,
      TEST_2,
    }

    // when
    const result = getArrayFromEnum(Test);

    // then
    expect(result).toEqual([
      'TEST_1',
      'TEST_2',
    ]);
  });

  test('#getHead returns safe array head', () => {
    // given
    const emptyArray = [];
    const filledArray = ['test'];

    // when
    const none = getHead<string>(emptyArray).valueOr('');
    const some = getHead(filledArray).valueOr('');

    // then
    expect(none).toEqual('');
    expect(some).toEqual('test');
  });

  test('#filterArray filters an array by given predicate', () => {
    // given
    const array = [0, 1, 2, 3, 4];
    const predicateFn = (v: number) => v % 2 === 0;

    // when
    const result = filterArray(predicateFn)(array);

    // then
    expect(result).toEqual([0, 2, 4]);
  });

  test('#mapArray maps array items by given function', () => {
    // given
    const array = [0, 1, 2, 3, 4];
    const mapFn = (v: number) => v + 1;

    // when
    const result = mapArray(mapFn)(array);

    // then
    expect(result).toEqual([1, 2, 3, 4, 5]);
  });
});
