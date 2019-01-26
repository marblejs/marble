import { HttpMethod, HttpRequest } from '../http.interface';
import { HttpEffect, HttpMiddleware, HttpEffectResponse } from '../effects/http-effects.interface';

// Route
export interface RouteEffect<T extends HttpRequest = HttpRequest> {
  path: string;
  method: HttpMethod;
  effect: HttpEffect<T, HttpEffectResponse>;
  middleware?: HttpMiddleware;
}

export interface RouteEffectGroup {
  path: string;
  middlewares: HttpMiddleware[];
  effects: (RouteEffect | RouteEffectGroup)[];
}

// Combiner
export interface RouteCombinerConfig {
  middlewares?: HttpMiddleware[];
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
  middleware?: HttpMiddleware | undefined;
  effect: HttpEffect;
}

export interface RoutingItem {
  regExp: RegExp;
  path: string;
  methods: Partial<Record<HttpMethod, RoutingMethod>>;
}

export interface RouteMatched {
  middleware?: HttpMiddleware | undefined;
  effect: HttpEffect;
  params: Record<string, string>;
}

export type Routing = RoutingItem[];
