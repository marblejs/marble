import { DEFAULT_HEADERS, headersFactory } from '../http.responseHeaders.factory';

// TODO: how to test with and without ENV Flag?
/*
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
*/

describe('Response headers factory with lower case flag', () => {

  const FACTORY_DATA = { status: 400, body: '', path: '/' };
  process.env['MARBLE_HTTP_CASE_INSENSITIVE_HEADER_NAMES'] = 'true';

  const lowerCasedDefaultHeaders = {};
  Object.keys(DEFAULT_HEADERS).forEach(h => {
    lowerCasedDefaultHeaders[h.toLowerCase()] = DEFAULT_HEADERS[h];
  });

  it('returns default headers if custom are not provided', () => {
    expect(headersFactory(FACTORY_DATA)()).toEqual(lowerCasedDefaultHeaders);
  });

  it('returns custom headers if are provided', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    expect(headersFactory(FACTORY_DATA)(CUSTOM_HEADERS)).toEqual({ ...lowerCasedDefaultHeaders, ...{
        'content-encoding': 'gzip'
      }});
  });

  it('returns not duplicated headers', () => {
    const CUSTOM_HEADERS = { 'Content-Type': 'application/json' };
    expect(headersFactory(FACTORY_DATA)(CUSTOM_HEADERS)).toEqual({ ...lowerCasedDefaultHeaders });
  });
});
