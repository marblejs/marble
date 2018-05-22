import { of } from 'rxjs';
import { HttpRequest, HttpResponse, HttpError, bodyParser$ } from '@marblejs/core';
import { Marbles } from '@marblejs/core/dist/util/marbles.spec-util';
import { validator$, Joi } from './joi.middleware';
import { take } from 'rxjs/operators';

const MockReq = require('mock-req');

describe('Joi middleware', () => {

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();
  });

  it('validator$ throws an error if using an invalid schema', done => {
    expect.assertions(1);

    const request = new MockReq({
      method: 'GET',
    });

    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const schema = { headers: 'foo' };
    const http$ = validator$(schema)(req$, res, {});

    http$.subscribe(() => {
      fail('Exceptions should be thrown');
      done();
    },
    error => {
      expect(error).toBeDefined();
      done();
    });
  });

  it('validator$ throws an error if pass a invalid header', done => {
    expect.assertions(1);

    const request = new MockReq({
      method: 'GET',
      headers: {
        token: '@@@'
      }
    });

    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const schema = { headers: Joi.object({
      token: Joi.string().token().required(),
    }) };
    const http$ = validator$(schema)(req$, res, {});

    http$.subscribe(() => {
      fail('Exceptions should be thrown');
      done();
    },
    error => {
      expect(error).toBeDefined();
      done();
    });
  });

  it('validator$ validates header', done => {
    expect.assertions(1);

    const request = new MockReq({
      method: 'GET',
      headers: {
        token: '181782881DB38D84',
      }
    });

    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const schema = { headers: Joi.object({
      token: Joi.string().token().required(),
    }) };
    const http$ = validator$(schema)(req$, res, {});

    http$.subscribe(data => {
      expect(data).toBeTruthy();
      done();
    });
  });

  it('validator$ validates header and body', done => {
    expect.assertions(2);

    const request = new MockReq({
      method: 'POST',
      headers: {
        token: '181782881DB38D84',
      }
    });

    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const schema = {
      headers: Joi.object({
        token: Joi.string().token().required(),
      }),
      body: Joi.object({
        id: Joi.number().min(1).max(4),
        role: Joi.string().default('admin'),
      }),
    };
    const http$ = bodyParser$(req$, res, {});
    const valid$ = validator$(schema)(http$, res, {});

    valid$.subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.body.role).toBe('admin'),
      done();
    });

    request.write({ id: 4 });
    request.end();
  });
});
