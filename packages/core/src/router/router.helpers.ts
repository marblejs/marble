import { RouteGroup, RoutingGroup, Routing, RouteCombinerConfig } from './router.interface';
export { Routing };

export const isRouteGroup = (item): item is RouteGroup =>
  Array.isArray(item.effects) &&
  Array.isArray(item.middlewares);

  export const isRouteCombinerConfig = (item): item is RouteCombinerConfig =>
    Array.isArray(item.effects) &&
    Array.isArray(item.middlewares);

export const isRoutingGroup = (item): item is RoutingGroup =>
  item.length === 2;
