import * as path from 'path';
import * as fs from 'fs';
import { HttpRequest, HttpResponse, HttpStatus } from '../../http.interface';
import { handleResponse } from '../response.handler';
import { DEFAULT_HEADERS } from '../responseHeaders.factory';
import { ContentType } from '../../+internal';

const createMockResponse = () => ({
  writeHead: jest.fn(),
  setHeader: jest.fn(),
  end: jest.fn(),
} as any as HttpResponse);

const createMockRequest = () => ({
  url: '/',
} as any as HttpRequest);

describe('Response handler', () => {

  let request;
  let response;
  let handle;

  beforeEach(() => {
    request = createMockRequest();
    response = createMockResponse();
    handle = handleResponse(response)(request);
  });

  it('sets provided status', () => {
    handle({ status: HttpStatus.FORBIDDEN });
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.FORBIDDEN, DEFAULT_HEADERS);
  });

  it('sets status OK if is not explicitly set', () => {
    handle({});
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, DEFAULT_HEADERS);
  });

  it('sets default headers if are not explicitly set', () => {
    handle({});
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, DEFAULT_HEADERS);
  });

  it('sets provided headers', () => {
    const CUSTOM_HEADERS = { 'Content-Encoding': 'gzip' };
    handle({ headers: CUSTOM_HEADERS, body: {} });
    expect(response.writeHead).toHaveBeenCalledWith(HttpStatus.OK, { ...DEFAULT_HEADERS, ...CUSTOM_HEADERS });
    expect(response.setHeader).toHaveBeenCalledWith('Content-Length', 2);
  });

  it('sets unefined response if body is not provided', () => {
    handle({});
    expect(response.end).toHaveBeenCalledWith(undefined);
  });

  it('sets stringified response if object body is provided', () => {
    handle({ body: { foo: 'bar' } });
    expect(response.end).toHaveBeenCalledWith(JSON.stringify({ foo: 'bar' }));
  });

  it('pipes body stream to response', () => {
    // given
    const pathToFile = path.resolve(__dirname, '../../../../../assets/media', 'audio.mp3');
    const body = fs.createReadStream(pathToFile);
    const headers = { 'Content-Type': ContentType.AUDIO_MPEG };

    // when
    jest.spyOn(body, 'pipe').mockImplementation(jest.fn);
    handle({ body, headers });

    // then
    expect(body.pipe).toHaveBeenCalledWith(response);
  });

  it('returns immediately if response was finished', done => {
    // given
    response = { ...createMockResponse(), finished: true } as HttpResponse;
    handle = handleResponse(response)(response);

    // when
    const result = handle({});

    // then
    expect(response.end).not.toHaveBeenCalled();
    result.subscribe(
      () => {
        fail('Stream should be empty');
        done();
      },
      () => {
        fail('Stream should be empty');
        done();
      },
      () => {
        expect(true).toBe(true);
        done();
      },
    );
  });

});
