import { HttpMethod, HttpRequest } from '../http.interface';
import { HttpEffect, HttpMiddlewareEffect, HttpEffectResponse } from '../effects/http-effects.interface';

// Route
export interface RouteEffect<T extends HttpRequest = HttpRequest> {
  path: string;
  method: HttpMethod;
  effect: HttpEffect<T, HttpEffectResponse>;
  middleware?: HttpMiddlewareEffect;
  meta?: any;
}

export interface RouteEffectGroup {
  path: string;
  middlewares: HttpMiddlewareEffect[];
  effects: (RouteEffect | RouteEffectGroup)[];
}

// Combiner
export interface RouteCombinerConfig {
  middlewares?: HttpMiddlewareEffect[];
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
  middleware?: HttpMiddlewareEffect | undefined;
  effect: HttpEffect;
}

export interface RoutingItem {
  regExp: RegExp;
  path: string;
  methods: Partial<Record<HttpMethod, RoutingMethod>>;
}

export interface RouteMatched {
  middleware?: HttpMiddlewareEffect | undefined;
  effect: HttpEffect;
  params: Record<string, string>;
}

export type Routing = RoutingItem[];
