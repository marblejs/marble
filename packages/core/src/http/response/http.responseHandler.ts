import * as url from 'url';
import { EMPTY } from 'rxjs';
import { fold } from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { constVoid } from 'fp-ts/lib/function';
import { HttpEffectResponse } from '../effects/http.effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { isStream } from '../../+internal/utils';
import { ContextProvider } from '../../context/context.factory';
import { HttpRequestMetadataStorageToken } from '../server/http.server.tokens';
import { getTestingRequestIdHeader, isTestingMetadataOn } from '../../+internal/testing';
import { headersFactory } from './http.responseHeaders.factory';
import { bodyFactory } from './http.responseBody.factory';

export const handleResponse = (ask: ContextProvider) => (res: HttpResponse) => (req: HttpRequest) => (effectResponse: HttpEffectResponse) => {
  if (res.finished) { return EMPTY; }

  const status = effectResponse.status || HttpStatus.OK;
  const path = url.parse(req.url).pathname || '';

  const headersFactoryWithData = headersFactory({ body: effectResponse.body, path, status });
  const headers = headersFactoryWithData(effectResponse.headers);

  const bodyFactoryWithHeaders = bodyFactory(headers);
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
    if (body) {
      res.setHeader('Content-Length', Buffer.byteLength(body));
    }

    res.writeHead(status, headers);
    res.end(body);
  }

  return EMPTY;
};
