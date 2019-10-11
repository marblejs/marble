import { HttpRequest, createContext, createEffectMetadata, lookup } from '@marblejs/core';
import { createHttpResponse } from '@marblejs/core/dist/+internal/testing';
import { bodyParser$ } from '@marblejs/middleware-body';
import { of } from 'rxjs';
import { validator$, Joi } from '../../src';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const MockReq = require('mock-req');

describe('Joi middleware - Body', () => {
  const context = createContext();
  const client = createHttpResponse();
  const metadata = createEffectMetadata({ ask: lookup(context), client });

  it(`throws an error if doesn't pass a required field`, done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    const req$ = of(request as HttpRequest);
    const schema = {
      body: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };

    const http$ = bodyParser$()(req$, metadata);
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
    const schema = {
      body: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };

    const http$ = bodyParser$()(req$, metadata);
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
    const schema = {
      body: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };

    const http$ = bodyParser$()(req$, metadata);
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
