/* eslint-disable deprecation/deprecation */
/* eslint-disable @typescript-eslint/no-var-requires */

import { of } from 'rxjs';
import { HttpRequest } from '@marblejs/core';
import { createHttpRequest } from '@marblejs/core/dist/+internal/testing';
import { validator$, Joi } from '../../src';

describe('Joi middleware - Header', () => {
  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation(() => jest.fn());
  });

  test('should throws an error if dont pass a required field', done => {
    expect.assertions(2);

    const request = createHttpRequest({
      method: 'GET',
      headers: {}
    });

    const req$ = of(request);
    const schema = {
      headers: Joi.object({
        token: Joi.string()
          .token()
          .required()
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: error => {
        expect(error).toBeDefined();
        expect(error.message).toBe('"token" is required');
        done();
      }
    });
  });

  test('should throws an error if pass a unknown field', done => {
    expect.assertions(2);

    const request = createHttpRequest({
      method: 'GET',
      headers: { end: 1 }
    });

    const req$ = of(request);
    const schema = {
      headers: Joi.object({
        start: Joi.date()
      })
    };
    const http$ = validator$(schema)(req$);

    http$.subscribe({
      next: () => fail('Exceptions should be thrown'),
      error: err => {
        expect(err).toBeDefined();
        expect(err.message).toBe('"end" is not allowed');
        done();
      }
    });
  });

  test('should validates header with unknown field', done => {
    expect.assertions(2);

    const request = createHttpRequest({
      method: 'GET',
      headers: { end: 1, start: '2018' },
    });

    const req$ = of(request as HttpRequest);
    const schema = {
      headers: Joi.object({
        start: Joi.number().integer()
      })
    };
    const http$ = validator$(schema, { stripUnknown: true })(req$);

    http$.subscribe(data => {
      expect(data).toBeTruthy();
      expect(data.headers).toEqual({ start: 2018 });
      done();
    });
  });

  test('should validates header with two fields', done => {
    expect.assertions(1);

    const request = createHttpRequest({
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
    const http$ = validator$(schema)(req$);

    http$.subscribe(data => {
      expect(data).toBeTruthy();
      done();
    });
  });
});
