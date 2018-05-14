import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';

export interface EffectResponse {
  status?: HttpStatus;
  body?: any;
  headers?: Record<string, string>;
}

export interface GroupedEffects {
  path: string;
  effects: Effects;
}

export interface EffectCombiner {
  (effects: Effects): (res: HttpResponse) => (req: HttpRequest) => Observable<EffectResponse>;
}

export interface MiddlewareCombiner {
  (effects: Effect<HttpRequest>[]): (res: HttpResponse) => (req: HttpRequest) => Observable<HttpRequest>;
}

export interface RouteCombiner {
  (path: string, effects: Effects): GroupedEffects;
}

export type Effect<T = EffectResponse, U = any> = (
  request$: Observable<HttpRequest>,
  response: HttpResponse,
  metadata: U
) => Observable<T>;

export type Effects = (Effect<EffectResponse> | GroupedEffects)[];
