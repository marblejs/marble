import { EffectResponse } from '../effects/effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { bodyFactory } from './responseBody.factory';
import { headersFactory } from './responseHeaders.factory';

export const handleResponse = (res: HttpResponse) => (req: HttpRequest) => (
  effect: EffectResponse,
) => {
  const status = effect.status || HttpStatus.OK;
  const headers = headersFactory({ body: effect.body, path: req.url!, status })(
    effect.headers,
  );
  const body = bodyFactory(headers)(effect.body);

  if (body) {
    res.setHeader('Content-Length', Buffer.byteLength(body));
  }

  res.writeHead(status, headers);
  res.end(body);
};
