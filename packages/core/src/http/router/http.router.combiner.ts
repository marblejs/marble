import { HttpMiddlewareEffect } from '../effects/http.effects.interface';
import { RouteCombinerConfig, RouteEffectGroup, RouteEffect } from './http.router.interface';
import { isRouteCombinerConfig, decorateMiddleware } from './http.router.helpers';

export function combineRoutes(path: string, config: RouteCombinerConfig): RouteEffectGroup;
export function combineRoutes(path: string, effects: (RouteEffect | RouteEffectGroup)[]): RouteEffectGroup;
export function combineRoutes(
  path: string,
  configOrEffects: RouteCombinerConfig | (RouteEffect | RouteEffectGroup)[]
): RouteEffectGroup {
  return {
    path,
    effects: isRouteCombinerConfig(configOrEffects)
      ? configOrEffects.effects
      : configOrEffects,
    middlewares: isRouteCombinerConfig(configOrEffects)
      ? (configOrEffects.middlewares || [])
      : [],
  };
}

export const combineRouteMiddlewares =
  (decorate: boolean) => (...middlewares: HttpMiddlewareEffect[]): HttpMiddlewareEffect => (input$, ctx) =>
    middlewares.reduce(
      (i$, middleware) => middleware(decorate ? decorateMiddleware(i$) : i$, ctx),
      decorate ? decorateMiddleware(input$) : input$,
    );
