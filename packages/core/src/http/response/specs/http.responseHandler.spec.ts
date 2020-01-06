import * as path from 'path';
import * as fs from 'fs';
import { HttpResponse, HttpStatus } from '../../http.interface';
import { handleResponse } from '../http.responseHandler';
import { DEFAULT_HEADERS } from '../http.responseHeaders.factory';
import { ContentType, createMockEffectContext, createHttpResponse, createHttpRequest } from '../../../+internal';

describe('Response handler', () => {
  const effectContext = createMockEffectContext();

  let request;
  let response;
  let handle;

  beforeEach(() => {
    request = createHttpRequest({ url: '/', method: 'GET' });
    response = createHttpResponse();
    handle = handleResponse(effectContext.ask)(response)(request);
  });

  test('sets provided status', () => {
    handle({ status: HttpStatus.FORBIDDEN });
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.FORBIDDEN, DEFAULT_HEADERS);
  });

  test('sets status OK if is not explicitly set', () => {
    handle({});
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, DEFAULT_HEADERS);
  });

  test('sets default headers if are not explicitly set', () => {
    handle({});
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, DEFAULT_HEADERS);
  });

  test('sets provided headers', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    handle({ headers: CUSTOM_HEADERS, body: {} });
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, { ...DEFAULT_HEADERS, ...CUSTOM_HEADERS });
    expect(response.setHeader).toHaveBeenCalledWith('Content-Length', 2);
  });

  test('sets unefined response if body is not provided', () => {
    handle({});
    expect(response.end).toHaveBeenCalledWith(undefined);
  });

  test('sets stringified response if object body is provided', () => {
    handle({ body: { foo: 'bar' } });
    expect(response.end).toHaveBeenCalledWith(JSON.stringify({ foo: 'bar' }));
  });

  test('pipes body stream to response', () => {
    // given
    const pathToFile = path.resolve(__dirname, '../../../../../../assets/media', 'audio.mp3');
    const body = fs.createReadStream(pathToFile);
    const headers = { 'Content-Type': ContentType.AUDIO_MPEG };

    // when
    jest.spyOn(body, 'pipe').mockImplementation(() => jest.fn() as any);
    handle({ body, headers });

    // then
    expect(body.pipe).toHaveBeenCalledWith(response);
  });

  test('returns immediately if response was finished', done => {
    // given
    response = { ...createHttpResponse(), finished: true } as HttpResponse;
    handle = handleResponse(effectContext.ask)(response)(response);

    // when
    const result = handle({});

    // then
    expect(response.end).not.toHaveBeenCalled();
    result.subscribe(
      () => fail('Stream should be empty'),
      () => fail('Stream should be empty'),
      () => {
        expect(true).toBe(true);
        done();
      },
    );
  });

});
