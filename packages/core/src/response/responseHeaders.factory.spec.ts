import { DEFAULT_HEADERS, headersFactory } from './responseHeaders.factory';

describe('Response headers factory', () => {

  const FACTORY_DATA = { status: 400, body: '', path: '/' };

  it('returns default headers if custom are not provided', () => {
    expect(headersFactory(FACTORY_DATA)()).toEqual(DEFAULT_HEADERS);
  });

  it('returns custom headers if are provided', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    expect(headersFactory(FACTORY_DATA)(CUSTOM_HEADERS)).toEqual({ ...DEFAULT_HEADERS, ...CUSTOM_HEADERS });
  });

  it('returns not duplicated headers', () => {
    const CUSTOM_HEADERS = { 'Content-Type': 'application/json' };
    expect(headersFactory(FACTORY_DATA)(CUSTOM_HEADERS)).toEqual({ ...DEFAULT_HEADERS });
  });

});
