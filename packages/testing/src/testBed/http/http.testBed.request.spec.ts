import { pipe } from 'fp-ts/lib/pipeable';
import { createRequest, withHeaders, withBody, withPath } from './http.testBed.request';

describe('TestBed - HTTP request', () => {
  test('creates request with custom applied headers and body', () => {
    // given
    const port = 8080;
    const host = '127.0.0.1';
    const defaultHeaders = { 'Content-Type': 'application/json' };
    const req = createRequest(port, host, defaultHeaders);

    // when
    const builtRequest = pipe(
      req('POST'),
      withPath('/test'),
      withHeaders({ 'Authorization': 'Bearer TOKEN' }),
      withHeaders({ 'Accept': 'text/html' }),
      withBody({ foo: 'bar' }),
    );

    // then
    expect(builtRequest).toEqual({
      method: 'POST',
      port: 8080,
      host: '127.0.0.1',
      path: '/test',
      protocol: 'http:',
      body: { foo: 'bar' },
      headers: {
        'Accept': 'text/html',
        'Authorization': 'Bearer TOKEN',
        'Content-Type': 'application/json',
        'X-Testing-Request-Id': expect.any(String),
      },
    });
  });
});
