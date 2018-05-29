import { urlParamsFactory } from './urlParams.factory';
import { HttpRequest } from '../../http.interface';

describe('urlParamsFactory', () => {
  const req = {
    matchers: ['/api/v1', '/user'],
    url: '/api/v1/user/bob/12',
  } as HttpRequest;

  test('should return empty object when passed path without params', () => {
    // given
    const invalidPath = '/name/id';

    // when
    const params = urlParamsFactory(req, invalidPath);

    // then
    expect(params).toEqual({});
  });

  test('should return empty object when in path missing params', () => {
    // given
    const exampleReq = { ...req, url: '/api/v1/user/bob' } as HttpRequest;
    const examplePath = '/:name/:id';

    // when
    const params = urlParamsFactory(exampleReq, examplePath);

    // then
    expect(params).toEqual({});
  });

  test('should return object with multiple params', () => {
    // given
    const examplePath = '/:name/:id';
    const expectedParamsObj = { name: 'bob', id: '12' };

    // when
    const params = urlParamsFactory(req, examplePath);

    // then
    expect(params).toEqual(expectedParamsObj);
  });

  test('should return object with optional params', () => {
    // given
    const examplePath = '/:name/:id?';
    const expectedParamsObj = { name: 'bob', id: '12' };

    // when
    const params = urlParamsFactory(req, examplePath);

    // then
    expect(params).toEqual(expectedParamsObj);
  });

  test('should return object without optional params', () => {
    // given
    const exampleReq = { ...req, url: '/api/v1/user/bob' } as HttpRequest;
    const examplePath = '/:name/:id?';
    const expectedParamsObj = { name: 'bob' };

    // when
    const params = urlParamsFactory(exampleReq, examplePath);

    // then
    expect(params).toEqual(expectedParamsObj);
  });
});
