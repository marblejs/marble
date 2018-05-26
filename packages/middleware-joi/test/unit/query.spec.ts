import { validator$, Joi } from '../../src';
import { of } from 'rxjs';
import { HttpRequest, HttpResponse, RouteParameters } from '@marblejs/core';

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

describe('Joi middleware - Query', () => {
  it('should throws an error if dont pass a required field', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', null, [], {}));
    const res = {} as HttpResponse;
    const schema = {
      query: Joi.object({
        id: Joi.string()
          .token()
          .required()
      })
    };
    const http$ = validator$(schema)(req$, res, {});

    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('"id" is required');
        done();
      }
    );
  });

  // FIXME: fix after merge PR
  it.skip('should throws an error if pass a invalid field', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', 'id=@@@', [], {}));
    const res = {} as HttpResponse;
    const schema = {
      query: Joi.object({
        id: Joi.string().token()
      })
    };
    const http$ = validator$(schema)(req$, res, {});

    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        expect(error.message).toBe(
          '"id" must only contain alpha-numeric and underscore characters'
        );
        done();
      }
    );
  });

  it.skip('should validates query with a valid value', done => {
    expect.assertions(2);

    const req$ = of(reqMatched('/test', 'id=181782881DB38D84', [], {}));
    const res = {} as HttpResponse;
    const schema = {
      query: Joi.object({
        id: Joi.string().token()
      })
    };
    const http$ = validator$(schema)(req$, res, {});

    http$.subscribe(data => {
      expect(data).toBeDefined();
      expect(data.query).toEqual({ id: '181782881DB38D84' });
      done();
    });
  });
});
