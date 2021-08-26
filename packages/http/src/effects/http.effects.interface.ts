import { Event, Effect } from '@marblejs/core';
import { HttpRequest, HttpStatus, HttpHeaders, HttpServer, WithHttpRequest } from '../http.interface';

export interface HttpEffectResponse<T = any> {
  request?: HttpRequest;
  status?: HttpStatus;
  headers?: HttpHeaders;
  body?: T;
}

export interface HttpMiddlewareEffect<
  I extends HttpRequest = HttpRequest,
  O extends HttpRequest = HttpRequest,
> extends HttpEffect<I, O> {}

export interface HttpErrorEffect<
  Err extends Error = Error,
  Req extends HttpRequest = HttpRequest,
> extends HttpEffect<
  WithHttpRequest<{ error: Err }, Req>,
  WithHttpRequest<HttpEffectResponse>
> {}

export interface HttpServerEffect<
  Ev extends Event = Event
> extends HttpEffect<Ev, any> {}

export interface HttpOutputEffect<
  Req extends HttpRequest = HttpRequest,
> extends HttpEffect<
  WithHttpRequest<HttpEffectResponse, Req>,
  WithHttpRequest<HttpEffectResponse>
> {}

export interface HttpEffect<
  I = HttpRequest,
  O = HttpEffectResponse,
> extends Effect<I, O, HttpServer> {}
