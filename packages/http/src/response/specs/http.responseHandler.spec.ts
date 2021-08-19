import * as path from 'path';
import * as fs from 'fs';
import { lastValueFrom, Observable } from 'rxjs';
import { HttpResponse, HttpStatus } from '../../http.interface';
import { handleResponse } from '../http.responseHandler';
import { createMockEffectContext, createHttpRequest, createHttpResponse } from '../../+internal/testing.util';
import { ContentType } from '../../+internal/contentType.util';
import { HttpEffectResponse } from '../../effects/http.effects.interface';

describe('#handleResponse', () => {
  const effectContext = createMockEffectContext();

  let request;
  let response;
  let handle: (effectResponse: HttpEffectResponse) => Observable<boolean>;

  beforeEach(() => {
    request = createHttpRequest({ url: '/', method: 'GET' });
    response = createHttpResponse();
    handle = handleResponse(effectContext.ask)(response)(request);
  });

  test('sets provided status', async () => {
    const output = await lastValueFrom(handle({ status: HttpStatus.FORBIDDEN }));
    expect(output).toEqual(true);
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.FORBIDDEN, {
      'content-length': 0,
      'content-type': 'application/json',
      'x-content-type-options': 'nosniff',
    });
  });

  test('sets status OK if is not explicitly set', async () => {
    const output = await lastValueFrom(handle({}));
    expect(output).toEqual(true);
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, {
      'content-length': 0,
      'content-type': 'application/json',
      'x-content-type-options': 'nosniff',
    });
  });

  test('sets default headers if are not explicitly set', async () => {
    const output = await lastValueFrom(handle({}));
    expect(output).toEqual(true);
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, {
      'content-length': 0,
      'content-type': 'application/json',
      'x-content-type-options': 'nosniff',
    });
  });

  test('sets provided headers', async () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    const output = await lastValueFrom(handle({ headers: CUSTOM_HEADERS, body: { test: 'test' } }));
    expect(output).toEqual(true);
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, {
      'content-encoding': 'gzip',
      'content-length': 15,
      'content-type': 'application/json',
      'x-content-type-options': 'nosniff',
    });
  });

  test('sets "undefined" response if body is not provided', async () => {
    const output = await lastValueFrom(handle({}));
    expect(output).toEqual(true);
    expect(response.end).toHaveBeenCalledWith(undefined, expect.anything());
  });

  test('sets stringified response if object body is provided', async () => {
    const output = await lastValueFrom(handle({ body: { foo: 'bar' } }));
    expect(output).toEqual(true);
    expect(response.end).toHaveBeenCalledWith(JSON.stringify({ foo: 'bar' }), expect.anything());
  });

  test('pipes body stream to response', async () => {
    // given
    const pathToFile = path.resolve(__dirname, '../../../../../assets/media', 'audio.mp3');
    const body = fs.createReadStream(pathToFile);
    const headers = { 'Content-Type': ContentType.AUDIO_MPEG };

    // when
    jest.spyOn(body, 'pipe').mockImplementation(() => jest.fn() as any);
    const output = await lastValueFrom(handle({ body, headers }));

    // then
    expect(output).toEqual(true);
    expect(body.pipe).toHaveBeenCalledWith(response);
  });

  test('returns immediately if response was finished', async () => {
    // given
    response = { ...createHttpResponse(), writableEnded: true } as HttpResponse;
    handle = handleResponse(effectContext.ask)(response)(response);

    // when
    const output = await lastValueFrom(handle({}));

    // then
    expect(output).toEqual(false);
    expect(response.end).not.toHaveBeenCalled();
  });
});
