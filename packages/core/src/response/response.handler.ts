import * as url from 'url';
import { EMPTY } from 'rxjs';
import { HttpEffectResponse } from '../effects/http-effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { bodyFactory } from './responseBody.factory';
import { headersFactory } from './responseHeaders.factory';
import { isStream } from '../+internal/utils';
import { applyMetadata } from '../+internal/testing';

export const handleResponse = (res: HttpResponse) => (req: HttpRequest) => (effect: HttpEffectResponse) => {
  if (res.finished) { return EMPTY; }

  const status = effect.status || HttpStatus.OK;
  const path = url.parse(req.url).pathname || '';

  const headersFactoryWithData = headersFactory({ body: effect.body, path, status });
  const headers = headersFactoryWithData(effect.headers);

  const bodyFactoryWithHeaders = bodyFactory(headers);
  const body = bodyFactoryWithHeaders(effect.body);

  applyMetadata(req, res);

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
