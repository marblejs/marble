import { validator$, Joi } from '../../src';
import { of } from 'rxjs';
import { HttpRequest, HttpResponse } from '@marblejs/core';
const MockReq = require('mock-req');

describe('Joi middleware - Header', () => {
  it('should throws an error if dont pass a required field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'GET',
      headers: {}
    });

    const req$ = of(request as HttpRequest);
    const schema = {
      headers: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };
    const http$ = validator$(schema)(req$, undefined as unknown as HttpResponse, {});

    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('"token" is required');
        done();
      }
    );
  });

  it('should throws an error if pass a unknown field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'GET',
      headers: {
        end: 1
      }
    });

    const req$ = of(request as HttpRequest);
    const schema = {
      headers: Joi.object({
        start: Joi.date()
      })
    };
    const http$ = validator$(schema)(req$, undefined as unknown as HttpResponse, {});

    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('"end" is not allowed');
        done();
      }
    );
  });

  it('should validates header with unknown field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'GET',
      headers: {
        end: 1,
        start: '2018'
      }
    });

    const req$ = of(request as HttpRequest);
    const schema = {
      headers: Joi.object({
        start: Joi.number().integer()
      })
    };
    const http$ = validator$(schema, { stripUnknown: true })(req$, undefined as unknown as HttpResponse, {});

    http$.subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.headers).toEqual({ start: 2018 });
      done();
    });
  });

  it('should validates header with two fields', done => {
    expect.assertions(1);

    const request = new MockReq({
      method: 'GET',
      headers: {
        token: '181782881DB38D84',
        id: 5
      }
    });

    const req$ = of(request as HttpRequest);
    const schema = {
      headers: Joi.object({
        token: Joi.string()
          .token()
          .required(),
        id: Joi.number()
          .integer()
          .min(1)
      })
    };
    const http$ = validator$(schema)(req$, undefined as unknown as HttpResponse, {});

    http$.subscribe(data => {
      expect(data).toBeTruthy();
      done();
    });
  });
});
