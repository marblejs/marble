import * as url from 'url';
import { defer, EMPTY, Observable } from 'rxjs';
import { ContextProvider } from '@marblejs/core';
import { isStream } from '@marblejs/core/dist/+internal/utils';
import { HttpEffectResponse } from '../effects/http.effects.interface';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { factorizeHeaders } from './http.responseHeaders.factory';
import { factorizeBody } from './http.responseBody.factory';

type HandleResponse =
  (ask: ContextProvider) =>
  (res: HttpResponse) =>
  (req: HttpRequest) =>
  (effectResponse: HttpEffectResponse) =>
    Observable<never>;

const writeBodyAndEndRequest = (res: HttpResponse) => (body: any): Promise<unknown> =>
  new Promise(resolve => res.end(body, () => resolve(undefined)));

export const handleResponse: HandleResponse = _ask => res => req => effectResponse => {
  if (res.finished) {
    // @TODO: log that case
    return EMPTY;
  }

  const status = effectResponse.status || HttpStatus.OK;
  const path = url.parse(req.url).pathname || '';

  const headers = factorizeHeaders({ body: effectResponse.body, path, status })(effectResponse.headers)();
  const body = factorizeBody(headers)(effectResponse.body);

  res.writeHead(status, headers);

  if (isStream(body)) {
    body.pipe(res);
    return EMPTY;
  }

  return defer(() => writeBodyAndEndRequest(res)(body)) as Observable<never>;
};
