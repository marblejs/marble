import { mapTo } from 'rxjs/operators';
import { HttpEffect } from '../http.effects.interface';
import { EffectFactory } from '../http.effects.factory';
import { HttpMethod } from '../../http.interface';

describe('EffectFactory', () => {

  let expectedError: Error;
  let coreError;

  beforeEach(() => {
    jest.unmock('../../../error/error.factory.ts');
    coreError = require('../../../error/error.factory.ts');
    coreError.coreErrorFactory = jest.fn(() => expectedError);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('factorizes RouteConfig', () => {
    // given
    const effect$: HttpEffect = req$ => req$.pipe(mapTo({ body: 'test' }));
    const path = '/foo';
    const method = 'GET';

    // when
    const factorizedEffect = EffectFactory
      .matchPath(path)
      .matchType(method)
      .use(effect$);

    // then
    expect(factorizedEffect.path).toEqual('/foo');
    expect(factorizedEffect.method).toEqual('GET');
    expect(factorizedEffect.effect).toBeDefined();
  });

  test('throws an error if "path" is not provided', () => {
    // given
    expectedError = new Error('Path cannot be empty');

    // when
    const effectFactoryFn = () => EffectFactory.matchPath(undefined as any);

    // then
    expect(effectFactoryFn).toThrowError(expectedError);
  });

  test('throws an error if "method" is not provided', () => {
    // given
    expectedError = new Error('HttpMethod needs to be defined');

    // when
    const effectFactoryFn = () => EffectFactory
      .matchPath('/')
      .matchType(undefined as any);

    // then
    expect(effectFactoryFn).toThrowError(expectedError);
  });

  test('throws an error if provided "method" is not included in the list', () => {
    // given
    expectedError = new Error(
      'HttpMethod needs to be one of the following: POST,PUT,PATCH,GET,HEAD,DELETE,CONNECT,OPTIONS,TRACE,*'
    );

    // when
    const effectFactoryFn = () => EffectFactory
      .matchPath('/')
      .matchType('TEST' as HttpMethod);

    // then
    expect(effectFactoryFn).toThrowError(expectedError);
  });

  test('throws an error if "effect" is not provided', () => {
    // given
    expectedError = new Error('Effect needs to be provided');

    // when
    const effectFactoryFn = () => EffectFactory
      .matchPath('/')
      .matchType('GET')
      .use(undefined as any);

    // then
    expect(effectFactoryFn).toThrowError(expectedError);
  });

});
