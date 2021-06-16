/* eslint-disable deprecation/deprecation */

import { of } from 'rxjs';
import { HttpRequest, RouteParameters } from '@marblejs/core';
import { validator$, Joi } from '../../src';

const reqMatched = (
  url: string,
  query = '',
  matchers: string[] = [],
  params: RouteParameters = {}
) =>
  (({
    url: !!query ? `${url}?${query}` : url,
    matchers,
    params
  } as any) as HttpRequest);

describe('Joi middleware - Params', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
  });

  it('should throws an error if dont pass a required field', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', undefined, [], {}));
    const schema = {
      params: Joi.object({
        id: Joi.string()
          .token()
          .required()
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: err => {
        expect(err).toBeDefined();
        expect(err.message).toBe('"id" is required');
        done();
      }
    });
  });

  it('should throws an error if pass a invalid field', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test/@@@', undefined, [], { id: '@@@' }));
    const schema = {
      params: Joi.object({
        id: Joi.string().token()
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: err => {
        expect(err).toBeDefined();
        expect(err.message).toBe('"id" must only contain alpha-numeric and underscore characters');
        done();
      }
    });
  });

  it('should validates params with a default value', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', undefined, [], {}));
    const schema = {
      params: Joi.object({
        id: Joi.string()
          .token()
          .default('181782881DB38D84')
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe(data => {
      expect(data).toBeDefined();
      expect(data.params).toEqual({ id: '181782881DB38D84' });
      done();
    });
  });
});
