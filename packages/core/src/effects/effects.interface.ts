import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';

export interface EffectResponse {
  status?: HttpStatus;
  body?: any;
  headers?: Record<string, string>;
}

export type Middleware<
  TBody = any,
  TParams = any,
  TQuery = any,
> = Effect<HttpRequest<TBody, TParams, TQuery>>;

export type ErrorEffect = Effect<EffectResponse, Error>;

export type Effect<T = EffectResponse, U = any> = (
  request$: Observable<HttpRequest>,
  response: HttpResponse,
  metadata: U
) => Observable<T>;
