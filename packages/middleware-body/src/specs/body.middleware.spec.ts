import * as qs from 'qs';
import * as MockReq from 'mock-req';
import { of, firstValueFrom } from 'rxjs';
import { HttpRequest } from '@marblejs/http';
import { ContentType } from '@marblejs/http/dist/+internal/contentType.util';
import { createMockEffectContext } from '@marblejs/http/dist/+internal/testing.util';
import { bodyParser$ } from '../body.middleware';

describe('bodyParser$ middleware', () => {
  const ctx = createMockEffectContext();

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'error').and.stub();
  });

  test('passes through non POST || PATCH || PUT requests', async () => {
    const request = new MockReq({
      method: 'GET',
    });

    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    const res = await http;
    expect(res.body).toBeUndefined();
  });

  test(`parses ${ContentType.APPLICATION_JSON} body`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_JSON },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write({ test: 'test' });
    request.end();

    const res = await http;
    expect(res.body).toEqual({ test: 'test' });
  });

  test(`parses ${ContentType.APPLICATION_JSON} body with "utf-8" encoding`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': `${ContentType.APPLICATION_JSON};charset=utf-8` },
    });
    const req$ = of(request);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write({ test: 'test' });
    request.end();

    const res = await http;
    expect(res.body).toEqual({ test: 'test' });
  });

  test(`parses ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));
    const body = {
      test: 'test',
      'test-2': 'test-2',
      'test-3': '3',
    };

    request.write(qs.stringify(body));
    request.end();

    const res = await http;
    expect(res.body).toEqual(body);
  });

  test(`parses complex ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));
    const body = {
      test1: 'field=with=equals&and&ampersands',
      test2: 'field=with=equals&and&ampersands',
    };

    request.write(qs.stringify(body));
    request.end();

    const res = await http;
    expect(res.body).toEqual(body);
  });

  test(`parses array-like ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} body`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));
    const body = {
      children: [
        { bar: 'foo', foo: 'bar' },
        { bar: 'foo', foo: 'bar' },
      ],
      somekey: 'value',
    };

    request.write(qs.stringify(body));
    request.end();

    const res = await http;
    expect(res.body).toEqual(body);
  });

  test(`parses ${ContentType.APPLICATION_OCTET_STREAM} body`, async () => {
    const message = 'test message';
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_OCTET_STREAM },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write(message);
    request.end();

    const res = await http;
    expect(res.body).toEqual(Buffer.from(message));
  });

  test(`parses ${ContentType.TEXT_PLAIN} body`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.TEXT_PLAIN },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write('test');
    request.end();

    const res = await http;
    expect(res.body).toEqual('test');
  });

  test(`parses ${ContentType.TEXT_PLAIN} body with "utf-8" encoding`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': `${ContentType.TEXT_PLAIN};charset=utf-8` },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write('Józef');
    request.end();

    const res = await http;
    expect(res.body).toEqual('Józef');
  });

  test(`parses ${ContentType.TEXT_PLAIN} body with "ascii" encoding`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': `${ContentType.TEXT_PLAIN};charset=ascii` },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write('Józef');
    request.end();

    const res = await http;
    expect(res.body).toEqual('JC3zef');
  });

  test(`parses ${ContentType.TEXT_HTML} body`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.TEXT_HTML },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write('<h1>test</h1>');
    request.end();

    const res = await http;
    expect(res.body).toEqual('<h1>test</h1>');
  });

  test(`throws exception on ${ContentType.APPLICATION_JSON} parse`, async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.APPLICATION_JSON },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write('test');
    request.end();

    await expect(http).rejects.toEqual(expect.objectContaining({
      message: 'Request body parse error: \"SyntaxError: Unexpected token e in JSON at position 1\"',
      status: 400,
    }));
  });

  test('throws exception on EventEmitter "error" event', async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.TEXT_PLAIN },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request._fail(new Error());
    request.write('test');
    request.end();

    await expect(http).rejects.toBeDefined();
  });

  test('does nothing if Content-Type is unsupported', async () => {
    const request = new MockReq({
      method: 'POST',
      headers: { 'Content-Type': ContentType.AUDIO_MPEG },
    });
    const req$ = of(request as HttpRequest);
    const http = firstValueFrom(bodyParser$()(req$, ctx));

    request.write('test');
    request.end();

    const res = await http;
    expect(res.body).toBeUndefined();
  });

});
