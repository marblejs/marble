import { request } from 'http';
import { pipe } from 'fp-ts/lib/pipeable';
import { sequenceT } from 'fp-ts/lib/Apply';
import * as O from 'fp-ts/lib/Option';
import { lookup, createServer, HttpMethod, HttpRequestMetadataStorageToken, ContextProvider } from '@marblejs/core';
import { closeServer, getServerAddress, isStream } from '@marblejs/core/dist/+internal/utils';
import { bodyFactory } from '@marblejs/core/dist/http/response/http.responseBody.factory';
import { TESTING_REQUEST_ID_HEADER, TestingMetadata } from '@marblejs/core/dist/+internal/testing';
import { TestBedType, TestBedFactory } from '../testBed.interface';
import { HttpTestBedConfig, HttpTestBed } from './http.testBed.interface';
import { createRequest, withBody, withHeaders, getHeader, withPath } from './http.testBed.request';
import { HttpTestBedRequest } from './http.testBed.request.interface';
import { HttpTestBedResponse } from './http.testBed.response.interface';
import { createResponse } from './http.testBed.response';
import { setTestingMetadata } from './http.testBed.util';

const sendRequest = async <T extends HttpMethod>(testBedRequest: HttpTestBedRequest<T>): Promise<HttpTestBedResponse> =>
  new Promise((resolve, reject) => {
    const clientRequest = request({
      port: testBedRequest.port,
      protocol: testBedRequest.protocol,
      headers: testBedRequest.headers,
      method: testBedRequest.method,
      host: testBedRequest.host,
      path: testBedRequest.path,
    })

    clientRequest.on('error', reject);

    clientRequest.on('response', clientResponse => {
      const chunks: any[] = [];

      clientResponse.on('data', chunk => chunks.push(chunk));

      clientResponse.on('end', () => {
        const { statusCode, statusMessage, headers } = clientResponse;
        const body = Buffer.concat(chunks);
        const testBedResponse = createResponse(testBedRequest)({ statusCode, statusMessage, headers, body });

        resolve(testBedResponse);
      });
    });

    if (testBedRequest.body && isStream(testBedRequest.body)) {
      return testBedRequest.body.pipe(clientRequest);
    }

    const body = bodyFactory(testBedRequest.headers)(testBedRequest.body);

    return clientRequest.end(body);
  });

const getRequestMetadata = (request: HttpTestBedRequest<any>) => (ask: ContextProvider): TestingMetadata => {
  const optionalStorage = ask(HttpRequestMetadataStorageToken);
  const optionalHeader = getHeader(TESTING_REQUEST_ID_HEADER)(request);

  return pipe(
    sequenceT(O.option)(optionalStorage, optionalHeader),
    O.chain(([storage, requestId]) => O.fromNullable(storage.get(requestId))),
    O.getOrElse(() => ({})),
  );
}

export const createHttpTestBed = (config: HttpTestBedConfig): TestBedFactory<HttpTestBed> => async (dependencies = []) => {
  const { listener } = config;

  const app = await createServer({ listener, dependencies });
  const server = await app();
  const ask = lookup(app.context);
  const finish = closeServer(server);
  const address = getServerAddress(server);
  const req = createRequest(address.port, address.host, config.defaultHeaders);

  const send: typeof sendRequest = async request => {
    const response = await sendRequest(request);
    const metadata = getRequestMetadata(request)(ask);
    return { ...response, metadata };
  };

  setTestingMetadata();

  return {
    type: TestBedType.HTTP,
    ask,
    finish,
    withHeaders,
    withBody,
    withPath,
    send,
    req
  };
};
