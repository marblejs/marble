import { HttpRequest, HttpResponse, createStaticInjectionContainer, createEffectMetadata } from '@marblejs/core';
import { bodyParser$ } from '@marblejs/middleware-body';
import { of } from 'rxjs';
import { validator$, Joi } from '../../src';

const MockReq = require('mock-req');

describe('Joi middleware - Body', () => {
  const metadata = createEffectMetadata({ inject: createStaticInjectionContainer().get });

  it(`throws an error if doesn't pass a required field`, done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const http$ = bodyParser$()(req$, res, metadata);
    const valid$ = validator$(schema)(http$);

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

  it('throws an error if passed a unknown field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const http$ = bodyParser$()(req$, res, metadata);
    const valid$ = validator$(schema)(http$);

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

  it('validates body with a unknown field', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
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

    const http$ = bodyParser$()(req$, res, metadata);
    const valid$ = validator$(schema, { allowUnknown: true })(http$);

    valid$.subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.body).toEqual({ token: '181782881DB38D84', id: 5 });
      done();
    });

    request.write({ token: '181782881DB38D84', id: 5 });
    request.end();
  });
});
