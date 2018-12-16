import { WebSocketEffect, WebSocketMiddleware } from '../effects/ws-effects.interface';

export interface WebSocketRoute {
  type: string;
  effect: WebSocketEffect;
}

export interface WebSocketRoutingItem {
  type: string;
  middleware: WebSocketMiddleware | undefined;
  effect: WebSocketEffect;
}

export type WebSocketRouting = WebSocketRoutingItem[];
