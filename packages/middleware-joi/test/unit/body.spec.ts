import { validator$, Joi } from '../../src';
import { of } from 'rxjs';
import { HttpRequest, HttpResponse, bodyParser$ } from '@marblejs/core';
const MockReq = require('mock-req');

describe('Joi middleware - Body', () => {
  it('should throws an error if dont pass a required field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST'
    });

    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const schema = {
      body: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };

    const http$ = bodyParser$(req$, res, {});
    const valid$ = validator$(schema)(http$, res, {});

    valid$.subscribe(
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

    request.write({});
    request.end();
  });

  it('should throws an error if pass a unknown field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST'
    });

    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const schema = {
      body: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };

    const http$ = bodyParser$(req$, res, {});
    const valid$ = validator$(schema)(http$, res, {});

    valid$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('"id" is not allowed');
        done();
      }
    );

    request.write({ token: '181782881DB38D84', id: 5 });
    request.end();
  });

  it('should validates body with a unknown field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST'
    });

    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const schema = {
      body: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };

    const http$ = bodyParser$(req$, res, {});
    const valid$ = validator$(schema, { allowUnknown: true })(http$, res, {});

    valid$.subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.body).toEqual({ token: '181782881DB38D84', id: 5 });
      done();
    });

    request.write({ token: '181782881DB38D84', id: 5 });
    request.end();
  });
});
