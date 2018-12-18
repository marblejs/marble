import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus, HttpHeaders } from '../http.interface';
import { HttpError } from '../error/error.model';

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

export interface Effect<
  T = HttpRequest,
  U = EffectHttpResponse,
  V = HttpResponse,
  W = any,
> {
  (input$: Observable<T>, client: V, meta?: W): Observable<U>;
}
