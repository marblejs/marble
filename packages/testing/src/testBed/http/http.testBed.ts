import { request } from 'http';
import { constant, pipe } from 'fp-ts/lib/function';
import { sequenceT } from 'fp-ts/lib/Apply';
import * as O from 'fp-ts/lib/Option';
import { lookup, ContextProvider } from '@marblejs/core';
import { createServer, HttpMethod, HttpRequestMetadataStorageToken, HttpRequestMetadata } from '@marblejs/http';
import { enableHttpRequestMetadata, getHttpRequestMetadataIdHeader } from '@marblejs/http/dist/+internal/metadata.util';
import { closeServer, getServerAddress } from '@marblejs/http/dist/+internal/server.util';
import { isStream } from '@marblejs/core/dist/+internal/utils';
import { factorizeBody } from '@marblejs/http/dist/response/http.responseBody.factory';
import { TestBedType, TestBedFactory } from '../testBed.interface';
import { HttpTestBedConfig, HttpTestBed } from './http.testBed.interface';
import { createRequest, withBody, withHeaders, withPath } from './http.testBed.request';
import { HttpTestBedRequest, HttpTestBedRequestBuilder } from './http.testBed.request.interface';
import { HttpTestBedResponse } from './http.testBed.response.interface';
import { createResponse } from './http.testBed.response';

const sendRequest = async <T extends HttpMethod>(testBedRequest: HttpTestBedRequest<T>): Promise<HttpTestBedResponse> =>
  new Promise((resolve, reject) => {
    const clientRequest = request({
      headers: testBedRequest.headers,
      port: testBedRequest.port,
      protocol: testBedRequest.protocol,
      method: testBedRequest.method,
      host: testBedRequest.host,
      path: testBedRequest.path,
    });

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

    if (testBedRequest.body) {
      const body = factorizeBody({ headers: testBedRequest.headers, body: testBedRequest.body });
      return clientRequest.end(body);
    }

    return clientRequest.end();
  });

const getRequestMetadata = (request: HttpTestBedRequest<any>) => (ask: ContextProvider): HttpRequestMetadata => {
  const optionalStorage = ask(HttpRequestMetadataStorageToken);
  const optionalHeader = getHttpRequestMetadataIdHeader(request.headers);

  return pipe(
    sequenceT(O.option)(optionalStorage, optionalHeader),
    O.chain(([storage, requestId]) => O.fromNullable(storage.get(requestId))),
    O.getOrElse(constant({})),
  );
};

export const createHttpTestBed = (config: HttpTestBedConfig): TestBedFactory<HttpTestBed> => async (dependencies = []) => {
  const { listener } = config;

  enableHttpRequestMetadata();

  const app = await createServer({ listener, dependencies });
  const server = await app();
  const ask = lookup(app.context);
  const finish = closeServer(server);
  const address = getServerAddress(server);
  const request = createRequest(address.port, address.host, config.defaultHeaders) as HttpTestBedRequestBuilder;

  const send: typeof sendRequest = async request => {
    const response = await sendRequest(request);
    const metadata = getRequestMetadata(request)(ask);
    return { ...response, metadata };
  };

  request.withHeaders = withHeaders;
  request.withBody = withBody;
  request.withPath = withPath;
  request.send = send;

  return {
    type: TestBedType.HTTP,
    finish,
    send,
    ask,
    request
  };
};
