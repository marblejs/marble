/* eslint-disable deprecation/deprecation */

import { of } from 'rxjs';
import { HttpRequest, RouteParameters, QueryParameters } from '@marblejs/core';
import { validator$, Joi } from '../../src';

const reqMatched = (
  url: string,
  matchers: string[] = [],
  params: RouteParameters = {},
  query: QueryParameters = {},
) => ({ url, matchers, params, query } as any as HttpRequest);

describe('Joi middleware - Query', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
  });

  test('should throws an error if dont pass a required field', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', undefined, {}, {}));
    const schema = {
      query: Joi.object({
        id: Joi.string()
          .token()
          .required()
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('"id" is required');
        done();
      }
    });
  });

  test('should throws an error if pass a invalid field', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', undefined, {}, { id: '@@@' }));
    const schema = {
      query: Joi.object({
        id: Joi.string().token()
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('"id" must only contain alpha-numeric and underscore characters');
        done();
      }
    });
  });

  test('should validates query with a valid value', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', undefined, {}, { id: '181782881DB38D84' }));
    const schema = {
      query: Joi.object({
        id: Joi.string().token()
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe(data => {
      expect(data).toBeDefined();
      expect(data.query).toEqual({ id: '181782881DB38D84' });
      done();
    });
  });
});
