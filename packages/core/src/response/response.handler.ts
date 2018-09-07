import { EMPTY } from 'rxjs';
import { EffectResponse } from '../effects/effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { bodyFactory } from './responseBody.factory';
import { headersFactory } from './responseHeaders.factory';

export const handleResponse = (res: HttpResponse) => (req: HttpRequest) => (effect: EffectResponse) => {
  if (res.finished) { return EMPTY; }

  const status = effect.status || HttpStatus.OK;

  const headersFactoryWithData = headersFactory({ body: effect.body, path: req.url, status });
  const headers = headersFactoryWithData(effect.headers);

  const bodyFactoryWithHeaders = bodyFactory(headers);
  const body = bodyFactoryWithHeaders(effect.body);

  if (body) {
    res.setHeader('Content-Length', Buffer.byteLength(body));
  }

  res.writeHead(status, headers);
  res.end(body);

  return EMPTY;
};
