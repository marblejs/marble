import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse, HttpStatus } from '../http.interface';

export interface EffectResponse {
  status?: HttpStatus;
  body?: object;
  headers?: Record<string, string>;
}

export type Effect<T = EffectResponse, U = any> = (
  request$: Observable<HttpRequest>,
  response: HttpResponse,
  metadata: U
) => Observable<T>;

export type EffectCombiner = (
  effects: (Effect<EffectResponse> | GroupedEffects)[]
) => (res: HttpResponse) => (req: HttpRequest) => Observable<EffectResponse>;

export type MiddlewareCombiner = (
  effects: Effect<HttpRequest>[]
) => (res: HttpResponse) => (req: HttpRequest) => Observable<HttpRequest>;

export type RoutesCombiner = (
  path: string,
  effects: (Effect<EffectResponse> | GroupedEffects)[]
) => GroupedEffects;

export interface GroupedEffects {
  path: string;
  effects: (Effect<EffectResponse> | GroupedEffects)[];
}

export const isGroup = (item): item is GroupedEffects =>
  typeof item === 'object' && !!item.path && !!item.effects;

export const isEffect = (item): item is Effect<EffectResponse> =>
  !isGroup(item);
