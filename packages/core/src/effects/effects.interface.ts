import * as http from 'http';
import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus, HttpHeaders } from '../http.interface';
import { HttpError } from '../error/error.model';
import { InjectionGetter } from '../server/server.injector';
import { Event } from '../event/event.interface';

export interface EffectHttpResponse<T = any> {
  status?: HttpStatus;
  headers?: HttpHeaders;
  body?: T;
}

export interface Middleware<
  I extends HttpRequest = HttpRequest,
  O extends HttpRequest = HttpRequest,
> extends Effect<I, O> {}

export interface ErrorEffect<T extends Error = HttpError>
  extends Effect<HttpRequest, EffectHttpResponse, HttpResponse, T> {}

export interface ServerEffect<T extends Event = Event>
  extends Effect<T, any, http.Server> {}

export interface Effect<
  T = HttpRequest,
  U = EffectHttpResponse,
  V = HttpResponse,
  W = InjectionGetter,
> {
  (input$: Observable<T>, client: V, meta: W): Observable<U>;
}
