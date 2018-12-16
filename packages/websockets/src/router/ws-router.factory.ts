import { WebSocketMiddleware } from '../effects/ws-effects.interface';
import { combineWebSocketMiddlewares } from '../effects/ws-effects.combiner';
import { WebSocketRoute, WebSocketRouting } from './ws-router.interface';

export const factorizeRouting = (
  routes: WebSocketRoute[] = [],
  middlewares: WebSocketMiddleware[] = [],
): WebSocketRouting  =>
  routes.map(({ type, effect }) => ({
    type,
    effect,
    middleware: combineWebSocketMiddlewares(middlewares),
  }));
