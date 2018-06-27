import { HttpMethod } from '../http.interface';
import { Effect, Middleware } from '../effects/effects.interface';

export type RouteEffects = RouteConfig | RouteGroup;

export interface RouteCombinerConfig {
  middlewares?: Middleware[];
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
  middlewares: Middleware[];
}

export interface ParametricRegExp {
  regExp: RegExp;
  parameters?: string[] | undefined;
}


export interface RoutingMethod {
  parameters?: string[] | undefined;
  middleware?: Middleware | undefined;
  effect: Effect;
}

export interface RoutingItem {
  regExp: RegExp;
  methods: Partial<Record<HttpMethod, RoutingMethod>>;
}

export interface RouteMatched {
  middleware?: Middleware | undefined;
  effect: Effect;
  params: Record<string, string>;
}

export type Routing = RoutingItem[];
