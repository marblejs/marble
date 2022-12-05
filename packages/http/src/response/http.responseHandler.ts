import * as url from 'url';
import { Stream } from 'stream';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import * as IO from 'fp-ts/lib/IO';
import * as T from 'fp-ts/lib/Task';
import { pipe } from 'fp-ts/lib/function';
import { ContextProvider, Logger, LoggerLevel, LoggerTag, LoggerToken, useContext } from '@marblejs/core';
import { fromIO, fromTask, isStream } from '@marblejs/core/dist/+internal/utils';
import { HttpEffectResponse } from '../effects/http.effects.interface';
import { HttpHeaders, HttpRequest, HttpResponse, HttpStatus } from '../http.interface';
import { factorizeHeaders } from './http.responseHeaders.factory';
import { factorizeBody } from './http.responseBody.factory';

type HandleResponse =
  (ask: ContextProvider) =>
  (res: HttpResponse) =>
  (req: HttpRequest) =>
  (effectResponse: HttpEffectResponse) =>
    Observable<boolean>;

const warnIfOutgoingConnectionEnded = (logger: Logger): IO.IO<void> => () =>
  logger({
    tag: LoggerTag.HTTP,
    level: LoggerLevel.WARN,
    type: 'Server',
    message: 'Attempted to send a response to an already finished connection',
  });

const getResponseStatus = (effectResponse: HttpEffectResponse): HttpStatus =>
  effectResponse.status ?? HttpStatus.OK;

const getRequestUrl = (request: HttpRequest): string =>
  url.parse(request.url).pathname ?? '';

export const writeHead = (status: HttpStatus, headers: HttpHeaders) => (response: HttpResponse): IO.IO<HttpHeaders> =>
  () => { response.writeHead(status, headers); return headers; };

export const endRequestAndWriteBody = (body: any) => (res: HttpResponse): T.Task<unknown> =>
  () => new Promise(resolve => res.end(body, () => resolve(true)));

export const endRequest = (res: HttpResponse): T.Task<unknown> =>
  () => new Promise(resolve => res.end(undefined, () => resolve(true)));

export const streamBody = (body: Stream) => (response: HttpResponse): T.Task<unknown> =>
  () => (body.pipe(response), Promise.resolve(true));

/**
 * Send HTTP response
 *
 * @sig `ContextProvider -> HttpResponse -> HttpRequest -> HttpEffectResponse -> Observable`
 * @since 1.0.0
 */
export const handleResponse: HandleResponse = ask => {
  const logger = useContext(LoggerToken)(ask);

  return res => req => effectRes => {
    if (res.writableEnded)
      return pipe(
        warnIfOutgoingConnectionEnded(logger),
        fromIO,
        map(() => false));

    const status = getResponseStatus(effectRes);
    const path = getRequestUrl(req);

    return pipe(
      factorizeHeaders({ body: effectRes.body, headers: effectRes.headers, path, status }),
      IO.chain(headers => writeHead(status, headers)(res)),
      IO.chain(headers => IO.of(factorizeBody({ headers, body: effectRes.body }))),
      T.fromIO,
      T.chain(body => isStream(body)
        ? streamBody(body)(res)
        : endRequestAndWriteBody(body)(res)),
      fromTask,
    ) as Observable<never>;
  };
};
