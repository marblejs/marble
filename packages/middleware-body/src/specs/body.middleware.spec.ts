import { HttpRequest, HttpResponse, createStaticInjectionContainer, createEffectMetadata } from '@marblejs/core';
import { Marbles, ContentType } from '@marblejs/core/dist/+internal';
import { of } from 'rxjs';
import { bodyParser$ } from '../body.middleware';

const MockReq = require('mock-req');

describe('bodyParser$ middleware', () => {
  const injector = createStaticInjectionContainer();
  const effectMeta = createEffectMetadata({ inject: injector.get });

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();
  });

  test('passes through non POST || PATCH || PUT requests', () => {
    const request = new MockReq({
      method: 'GET',
    });

    Marbles.assertEffect(bodyParser$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ]);
  });

  test(`parses ${ContentType.APPLICATION_JSON} body`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_JSON },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$()(req$, res, effectMeta);

    http$.subscribe(data => {
      expect(data.body).toEqual({ test: 'test' });
      done();
    });

    request.write({ test: 'test' });
    request.end();
  });

  test(`parses ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$()(req$, res, effectMeta);

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


  test(`throws exception on ${ContentType.APPLICATION_JSON} parse`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_JSON },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$()(req$, res, effectMeta);

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

  test(`parses ${ContentType.TEXT_PLAIN} body`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.TEXT_PLAIN },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$()(req$, res, effectMeta);

    http$.subscribe(data => {
      expect(data.body).toEqual('test');
      done();
    });

    request.write('test');
    request.end();
  });

  test('throws exception on EventEmitter "error" event', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.TEXT_PLAIN },
    });
    const req$ = of(request as HttpRequest);
    const res = {} as HttpResponse;
    const http$ = bodyParser$()(req$, res, effectMeta);

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
