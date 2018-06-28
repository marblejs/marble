import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';

export interface EffectResponse {
  status?: HttpStatus;
  body?: any;
  headers?: Record<string, string>;
}

export type Middleware = Effect<HttpRequest>;

export type ErrorMiddleware = Effect<EffectResponse, Error>;

export type Effect<T = EffectResponse, U = any> = (
  request$: Observable<HttpRequest>,
  response: HttpResponse,
  metadata: U
) => Observable<T>;
