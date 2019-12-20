import { RouteCombinerConfig, RouteEffectGroup, Routing } from './http.router.interface';

export { Routing };

export const isRouteEffectGroup = (item): item is RouteEffectGroup =>
  Array.isArray(item.effects) &&
  Array.isArray(item.middlewares);

export const isRouteCombinerConfig = (item): item is RouteCombinerConfig =>
  Array.isArray(item.effects);
