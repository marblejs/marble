import { headersFactory } from './responseHeaders.factory';

describe('Response headers factory', () => {

  it('returns default headers if custom are not provided', () => {
    const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };
    expect(headersFactory()).toEqual(DEFAULT_HEADERS);
  });

  it('returns custom headers if are provided', () => {
    const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    expect(headersFactory(CUSTOM_HEADERS)).toEqual({ ...DEFAULT_HEADERS, ...CUSTOM_HEADERS });
  });

  it('returns not duplicated headers', () => {
    const DEFAULT_HEADERS = { 'Content-Type': 'application/json' };
    const CUSTOM_HEADERS = { 'Content-Type': 'application/json' };
    expect(headersFactory(CUSTOM_HEADERS)).toEqual({ ...DEFAULT_HEADERS });
  });

});
