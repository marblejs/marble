import * as http from 'http';
import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus, HttpHeaders, ServerEvent } from '../http.interface';
import { HttpError } from '../error/error.model';
import { Injector } from '../server/server.injector';

export interface EffectHttpResponse<T = any> {
  status?: HttpStatus;
  headers?: HttpHeaders;
  body?: T;
}

export interface Middleware<
  I extends HttpRequest = HttpRequest,
  O extends HttpRequest = HttpRequest,
> extends Effect<I, O> {}

export interface ErrorEffect<T extends HttpError = HttpError>
  extends Effect<HttpRequest, EffectHttpResponse, HttpResponse, T> {}

export interface ServerEffect<T extends ServerEvent = ServerEvent>
  extends Effect<T, any, http.Server> {}

export interface Effect<
  T = HttpRequest,
  U = EffectHttpResponse,
  V = HttpResponse,
  W = typeof Injector.get,
> {
  (input$: Observable<T>, client: V, meta: W): Observable<U>;
}
