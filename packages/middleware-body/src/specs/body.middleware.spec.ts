import { HttpRequest, createContext, createEffectMetadata, lookup } from '@marblejs/core';
import { Marbles, ContentType, createHttpResponse } from '@marblejs/core/dist/+internal';
import * as qs from 'qs';
import { of } from 'rxjs';
import { bodyParser$ } from '../body.middleware';
import * as MockReq from 'mock-req';

describe('bodyParser$ middleware', () => {
  const client = createHttpResponse();
  const context = createContext();
  const meta = createEffectMetadata({ ask: lookup(context), client });

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
    const http$ = bodyParser$()(req$, meta);

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
    const http$ = bodyParser$()(req$, meta);
    const body = {
      test: 'test',
      'test-2': 'test-2',
      'test-3': '3',
    };

    http$.subscribe(data => {
      expect(data.body).toEqual(body);
      done();
    });

    request.write(qs.stringify(body));
    request.end();
  });

  test(`parses complex ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED },
    });
    const req$ = of(request as HttpRequest);
    const http$ = bodyParser$()(req$, meta);
    const body = {
      test1: 'field=with=equals&and&ampersands',
      test2: 'field=with=equals&and&ampersands',
    };

    http$.subscribe(data => {
      expect(data.body).toEqual(body);
      done();
    });

    request.write(qs.stringify(body));
    request.end();
  });

  test(`parses array-like ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED },
    });
    const req$ = of(request as HttpRequest);
    const http$ = bodyParser$()(req$, meta);
    const body = {
      children: [
        { bar: 'foo', foo: 'bar' },
        { bar: 'foo', foo: 'bar' },
      ],
      somekey: 'value',
    };

    http$.subscribe(data => {
      expect(data.body).toEqual(body),
      done();
    });

    request.write(qs.stringify(body));
    request.end();
  });

  test(`parses ${ContentType.APPLICATION_OCTET_STREAM} body`, done => {
    const message = 'test message';
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_OCTET_STREAM },
    });
    const req$ = of(request as HttpRequest);
    const http$ = bodyParser$()(req$, meta);

    http$.subscribe(data => {
      expect(data.body).toEqual(new Buffer(message));
      done();
    });

    request.write(message);
    request.end();
  });

  test(`parses ${ContentType.TEXT_PLAIN} body`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.TEXT_PLAIN },
    });
    const req$ = of(request as HttpRequest);
    const http$ = bodyParser$()(req$, meta);

    http$.subscribe(data => {
      expect(data.body).toEqual('test');
      done();
    });

    request.write('test');
    request.end();
  });

  test(`throws exception on ${ContentType.APPLICATION_JSON} parse`, done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_JSON },
    });
    const req$ = of(request as HttpRequest);
    const http$ = bodyParser$()(req$, meta);

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

  test('throws exception on EventEmitter "error" event', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.TEXT_PLAIN },
    });
    const req$ = of(request as HttpRequest);
    const http$ = bodyParser$()(req$, meta);

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

  test('does nothing if Content-Type is unsupported', done => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.AUDIO_MPEG },
    });
    const req$ = of(request as HttpRequest);
    const http$ = bodyParser$()(req$, meta);

    http$.subscribe(data => {
      expect(data.body).toBeUndefined();
      done();
    });

    request.write('test');
    request.end();
  });

});
