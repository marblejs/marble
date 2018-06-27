import { HttpMethod, HttpRequest } from '../http.interface';
import { Effect } from '../effects/effects.interface';

export type RouteEffects = RouteConfig | RouteGroup;

export interface RouteCombinerConfig {
  middlewares?: Effect<HttpRequest>[];
  effects: RouteEffects[];
}

export interface RouteConfig {
  path: string;
  method: HttpMethod;
  effect: Effect;
}

export interface RouteGroup {
  path: string;
  effects: RouteEffects[];
  middlewares: Effect<HttpRequest>[];
}

export type RoutingRoute = [string, HttpMethod, Effect];
export type RoutingGroup = [string, Routing];
export interface Routing extends Array<RoutingRoute | RoutingGroup> {}
