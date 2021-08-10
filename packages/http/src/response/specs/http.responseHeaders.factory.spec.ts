import { normalizeHeaders } from '../../+internal/header.util';
import { DEFAULT_HEADERS, factorizeHeaders } from '../http.responseHeaders.factory';

describe('#factorizeHeaders', () => {
  test.each([ null, undefined, {}, '' ])(`returns normalized default headers for "%s" body`, (body: any) => {
    const REQUEST = { status: 400, path: '/', body };

    expect(factorizeHeaders(REQUEST)()()).toEqual(normalizeHeaders({
      ...DEFAULT_HEADERS,
      'content-length': 0,
    }));
  });

  test('returns normalized default headers if custom are not provided', () => {
    const REQUEST = { status: 400, path: '/', body: 'A' };

    expect(factorizeHeaders(REQUEST)()()).toEqual(normalizeHeaders({
      ...DEFAULT_HEADERS,
      'content-length': 1,
    }));
  });

  test('returns normalized merged custom headers if are provided', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    const REQUEST = { status: 400, path: '/', body: 'A' };

    expect(factorizeHeaders(REQUEST)(CUSTOM_HEADERS)()).toEqual(normalizeHeaders({
      ...DEFAULT_HEADERS,
      ...CUSTOM_HEADERS,
      'content-length': 1,
    }));
  });


  test('returns normalized headers with calculated "content-length"', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    const REQUEST = { status: 400, path: '/', body: '123' };

    expect(factorizeHeaders(REQUEST)(CUSTOM_HEADERS)()).toEqual(normalizeHeaders({
      ...DEFAULT_HEADERS,
      ...CUSTOM_HEADERS,
      'content-length': 3,
    }));
  });

  test('returns normalized headers with calculated "content-length" when body is an object', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    const REQUEST = { status: 400, path: '/', body: { test: 'TEST' } };

    expect(factorizeHeaders(REQUEST)(CUSTOM_HEADERS)()).toEqual(normalizeHeaders({
      ...DEFAULT_HEADERS,
      ...CUSTOM_HEADERS,
      'content-length': 15,
    }));
  });

  test('returns normalized, not duplicated headers', () => {
    const CUSTOM_HEADERS = { 'content-type': 'application/json' };
    const REQUEST = { status: 400, path: '/', body: 'A' };

    expect(factorizeHeaders(REQUEST)(CUSTOM_HEADERS)()).toEqual(normalizeHeaders({
      ...DEFAULT_HEADERS,
      'content-length': 1,
    }));
  });
});
