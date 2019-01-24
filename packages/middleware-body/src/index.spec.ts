import { HttpRequest, HttpResponse, createStaticInjectionContainer, createEffectMetadata } from '@marblejs/core';
import { Marbles } from '@marblejs/core/dist/+internal';
import { of } from 'rxjs';
import { bodyParser$ } from '.';

const MockReq = require('mock-req');

describe('BodyParser middleware', () => {
  const injector = createStaticInjectionContainer();
  const effectMeta = createEffectMetadata({ inject: injector.get });

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();
  });

  it('bodyParser$ passes through non POST || PATCH || PUT requests', () => {
    const request = new MockReq({
      method: 'GET',
    });

    Marbles.assertEffect(bodyParser$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ]);
  });

  it('bodyParser$ parses "application/json" body', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$(req$, res, effectMeta);

    http$.subscribe(data => {
      expect(data.body).toEqual({ test: 'test' });
      done();
    });

    request.write({ test: 'test' });
    request.end();
  });

  it('bodyParser$ parses "x-www-form-urlencoded" body', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'x-www-form-urlencoded' },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$(req$, res, effectMeta);

    http$.subscribe(data => {
      expect(data.body).toEqual({
        test: 'test',
        'test-2': 'test-2',
        'test-3': 3,
      });
      done();
    });

    request.write('test=test&test-2=test-2&test-3=3');
    request.end();
  });


  it('bodyParser$ throws exception on "application/json" parse', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$(req$, res, effectMeta);

    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error.message).toBe('Request body parse error');
        expect(error.status).toBe(400);
        done();
      }
    );

    request.write('test');
    request.end();
  });

  it('bodyParser$ parses "text/plain" body', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$(req$, res, effectMeta);

    http$.subscribe(data => {
      expect(data.body).toEqual('test');
      done();
    });

    request.write('test');
    request.end();
  });

  it('bodyParser$ throws exception on EventEmitter "error" event', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$(req$, res, effectMeta);

    http$.subscribe(
      () => {
        fail('Exceptions should be thrown');
        done();
      },
      error => {
        expect(error).toBeDefined();
        done();
      }
    );

    request._fail(new Error());
    request.write('test');
    request.end();
  });

});
