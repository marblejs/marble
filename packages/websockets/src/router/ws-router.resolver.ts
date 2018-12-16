import { WebSocketRouting } from './ws-router.interface';
import { ExtendedWebSocketClient, WebSocketEvent } from '../websocket.interface';
import { Observable, EMPTY, of } from 'rxjs';
import { WebSocketEffectResponse } from '../effects/ws-effects.interface';
import { mergeMap } from 'rxjs/operators';

export const findRoute = (routing: WebSocketRouting, type: string) =>
  routing.find(route => route.type === type);

export const resolveRouting =
  (routing: WebSocketRouting) =>
  (client: ExtendedWebSocketClient) =>
  (event: WebSocketEvent): Observable<WebSocketEffectResponse> => {
    const routeMatched = findRoute(routing, event.type);

    if (!routeMatched) { return EMPTY; }

    return routeMatched.middleware
      ? routeMatched.middleware(of(event), client, undefined).pipe(
          mergeMap(event => routeMatched.effect(of(event), client, undefined))
        )
      : routeMatched.effect(of(event), client, undefined);
  };
