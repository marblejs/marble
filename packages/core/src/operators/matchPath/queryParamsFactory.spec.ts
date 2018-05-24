import { queryParamsFactory } from './queryParams.factory';

describe('queryParamsFactory', () => {
  test('should return empty object when passed URL with no valid params', () => {
    // given
    const invalidURLS = ['http://test.com', 'http://test.com?', null];

    invalidURLS.forEach(url => {
      // when
      const params = queryParamsFactory(url);

      // then
      expect(params).toEqual({});
    });
  });

  test('should return empty string when no value for provided key', () => {
    // given
    const exampleURL = 'http://test.com?testParam';
    const expectedParamsObj = { testParam: '' };

    // when
    const params = queryParamsFactory(exampleURL);

    // then
    expect(params).toEqual(expectedParamsObj);
  });

  test('should return object with multiple keys', () => {
    // given
    const exampleURL = 'http://test.com?testParam=test&testParam2=test2';
    const expectedParamsObj = { testParam: 'test', testParam2: 'test2' };

    // when
    const params = queryParamsFactory(exampleURL);

    // then
    expect(params).toEqual(expectedParamsObj);
  });

  test('should return array when passed two times same parameter', () => {
    // given
    const exampleURL = 'http://test.com?testParam=test&testParam=123';
    const expectedParamsObj = { testParam: ['test', '123'] };

    // when
    const params = queryParamsFactory(exampleURL);

    // then
    expect(params).toEqual(expectedParamsObj);
  });

  test('should return nested object', () => {
    // given
    const exampleURL = 'http://test.com?testParam[testNested]=test';
    const expectedParamsObj = { testParam: { testNested: 'test' } };

    // when
    const params = queryParamsFactory(exampleURL);

    // then
    expect(params).toEqual(expectedParamsObj);
  });
});
