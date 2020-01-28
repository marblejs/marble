import { Subject } from 'rxjs';
import { HttpMethod, HttpRequest } from '../http.interface';
import { HttpEffect, HttpMiddlewareEffect, HttpEffectResponse } from '../effects/http.effects.interface';

export type ErrorSubject = Subject<{
  error: Error;
  req: HttpRequest<unknown, unknown, unknown>;
}>;

// Route
export interface RouteMeta extends Record<string, any> {
  name?: string;
  continuous?: boolean;
  overridable?: boolean;
}

export interface RouteEffect<T extends HttpRequest = HttpRequest> {
  path: string;
  method: HttpMethod;
  effect: HttpEffect<T, HttpEffectResponse>;
  middleware?: HttpMiddlewareEffect;
  meta?: RouteMeta;
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
  parameters?: string[];
  middlewares: HttpMiddlewareEffect[];
  effect: HttpEffect;
  meta?: RouteMeta;
}

export interface RoutingItem {
  regExp: RegExp;
  path: string;
  methods: Partial<Record<HttpMethod, RoutingMethod>>;
}

export type Routing = RoutingItem[];

export interface BootstrappedRoutingItem extends Omit<RoutingItem, 'methods'> {
  methods: Partial<Record<HttpMethod, {
    subject: Subject<HttpRequest>;
    parameters?: string[];
  }>>;
}

export type BootstrappedRouting = BootstrappedRoutingItem[];

export interface RouteMatched {
  subject: Subject<HttpRequest>;
  params: Record<string, string>;
  path: string;
}
