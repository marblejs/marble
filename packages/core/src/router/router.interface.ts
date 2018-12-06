import { HttpMethod, HttpRequest } from '../http.interface';
import { Effect, Middleware, EffectResponse } from '../effects/effects.interface';

// Route
export interface RouteEffect<T extends HttpRequest = HttpRequest> {
  path: string;
  method: HttpMethod;
  effect: Effect<T, EffectResponse>;
  middleware?: Middleware;
}

export interface RouteEffectGroup {
  path: string;
  middlewares: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
}

// Combiner
export interface RouteCombinerConfig {
  middlewares?: Middleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
}

// Routing
export interface ParametricRegExp {
  regExp: RegExp;
  parameters?: string[] | undefined;
  path: string;
}

export interface RoutingMethod {
  parameters?: string[] | undefined;
  middleware?: Middleware | undefined;
  effect: Effect;
}

export interface RoutingItem {
  regExp: RegExp;
  path: string;
  methods: Partial<Record<HttpMethod, RoutingMethod>>;
}

export interface RouteMatched {
  middleware?: Middleware | undefined;
  effect: Effect;
  params: Record<string, string>;
}

export type Routing = RoutingItem[];
