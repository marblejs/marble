import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse } from '../http.interface';
import { StatusCode } from '../util';

export interface EffectResponse {
  status: StatusCode;
  body?: object;
  headers?: Record<string, string>;
}

export type Effect<T = EffectResponse, U = any> = (
  request$: Observable<HttpRequest>,
  response: HttpResponse,
  metadata: U,
) => Observable<T>;


export type EffectCombiner = (effects: Effect<EffectResponse>[]) => (res: HttpResponse) => (req: HttpRequest) =>
  Observable<EffectResponse>;

export type MiddlewareCombiner = (effects: Effect<HttpRequest>[]) => (res: HttpResponse) => (req: HttpRequest) =>
  Observable<HttpRequest>;
