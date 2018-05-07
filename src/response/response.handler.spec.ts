import { HttpResponse, HttpStatus } from '../http.interface';
import { handleResponse } from './response.handler';
import { DEFAULT_HEADERS } from './responseHeaders.factory';

const RESPONSE = {
  writeHead: jest.fn(),
  end: jest.fn(),
} as any as HttpResponse;

describe('Response handler', () => {

  const handle = handleResponse(RESPONSE);

  it('sets provided status', () => {
    handle({ status: HttpStatus.FORBIDDEN });
    expect(RESPONSE.writeHead).toHaveBeenCalledWith(HttpStatus.FORBIDDEN, DEFAULT_HEADERS);
  });

  it('sets status OK if is not explicitly set', () => {
    handle({});
    expect(RESPONSE.writeHead).toHaveBeenCalledWith(HttpStatus.OK, DEFAULT_HEADERS);
  });

  it('sets default headers if are not explicitly set', () => {
    handle({});
    expect(RESPONSE.writeHead).toHaveBeenCalledWith(HttpStatus.OK, DEFAULT_HEADERS);
  });

  it('sets provided headers', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    handle({ headers: CUSTOM_HEADERS });
    expect(RESPONSE.writeHead).toHaveBeenCalledWith(HttpStatus.OK, { ...DEFAULT_HEADERS, ...CUSTOM_HEADERS });
  });

  it('sets unefined response if body is not provided', () => {
    handle({});
    expect(RESPONSE.end).toHaveBeenCalledWith(undefined);
  });

  it('sets stringified response if object body is provided', () => {
    handle({ body: { foo: 'bar' } });
    expect(RESPONSE.end).toHaveBeenCalledWith(JSON.stringify({ foo: 'bar' }));
  });

});
