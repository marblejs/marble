import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus, HttpHeaders } from '../http.interface';

export interface EffectResponse<T = any> {
  body?: T;
}

export interface EffectHttpResponse<T = any> extends EffectResponse<T> {
  status?: HttpStatus;
  headers?: HttpHeaders;
}

export interface Middleware<
  I extends HttpRequest = HttpRequest,
  O extends HttpRequest = HttpRequest,
> extends Effect<I, O> {}

export interface ErrorEffect<T extends Error = Error>
  extends Effect<HttpRequest, EffectHttpResponse, HttpResponse, T> {}

export interface Effect<
  T = HttpRequest,
  U = EffectHttpResponse,
  V = HttpResponse,
  W = any,
> {
  (req$: Observable<T>, res: V, meta: W): Observable<U>;
}
