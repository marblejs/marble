import * as url from 'url';
import { EMPTY } from 'rxjs';
import { fold } from 'fp-ts/lib/Option';
import { constVoid, pipe } from 'fp-ts/lib/function';
import { ContextProvider } from '@marblejs/core';
import { isStream } from '@marblejs/core/dist/+internal/utils';
import { isTestingMetadataOn } from '@marblejs/core/dist/+internal/testing';
import { HttpEffectResponse } from '../effects/http.effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { HttpRequestMetadataStorageToken } from '../server/internal-dependencies/httpRequestMetadataStorage.reader';
import { getTestingRequestIdHeader } from '../+internal/header.util';
import { factorizeHeaders } from './http.responseHeaders.factory';
import { factorizeBody } from './http.responseBody.factory';

export const handleResponse = (ask: ContextProvider) => (res: HttpResponse) => (req: HttpRequest) => (effectResponse: HttpEffectResponse) => {
  if (res.finished) { return EMPTY; }

  const status = effectResponse.status || HttpStatus.OK;
  const path = url.parse(req.url).pathname || '';

  const headersFactoryWithData = factorizeHeaders({ body: effectResponse.body, path, status });
  const headers = headersFactoryWithData(effectResponse.headers)(); // @TODO: refactor `#handleResponse` function

  const bodyFactoryWithHeaders = factorizeBody(headers);
  const body = bodyFactoryWithHeaders(effectResponse.body);

  const testingHeader = getTestingRequestIdHeader(req);

  if (isTestingMetadataOn()) {
    pipe(
      ask(HttpRequestMetadataStorageToken),
      fold(constVoid, storage => storage.set(testingHeader, req.meta)),
    );
  }

  if (isStream(body)) {
    res.writeHead(status, headers);
    body.pipe(res);
  } else {
    res.writeHead(status, headers);
    res.end(body);
  }

  return EMPTY;
};
