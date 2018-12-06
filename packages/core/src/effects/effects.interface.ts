import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';

export interface EffectResponse {
  status?: HttpStatus;
  body?: any;
  headers?: Record<string, string>;
}

export interface Middleware<
  I extends HttpRequest = HttpRequest,
  O extends HttpRequest = HttpRequest,
> extends Effect<I, O> {}

export interface ErrorEffect<T extends Error = Error>
  extends Effect<HttpRequest, EffectResponse, T> {}

export interface Effect<T extends HttpRequest = HttpRequest, U = EffectResponse, V = any> {
  (req$: Observable<T>, res: HttpResponse, meta: V): Observable<U>;
}
