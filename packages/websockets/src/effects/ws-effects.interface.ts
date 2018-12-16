import { EffectResponse } from '@marblejs/core';
import { Observable } from 'rxjs';
import { WebSocketEvent, WebSocketType, WebSocketClient } from '../websocket.interface';

export interface WebSocketEffectResponse<T = any> extends EffectResponse<T> {
  type: WebSocketType;
}

export interface WebSocketMiddleware<
  I extends WebSocketEvent = WebSocketEvent,
  O extends WebSocketEvent = WebSocketEvent,
> extends WebSocketEffect<I, O> {}

export interface WebSocketErrorEffect<T extends Error = Error>
  extends WebSocketEffect<WebSocketEvent, WebSocketEffectResponse, WebSocketClient, T> {}

export interface WebSocketEffect<
  T = WebSocketEvent,
  U = WebSocketEffectResponse,
  V = WebSocketClient,
  W = any,
> {
  (event$: Observable<T>, client: V, meta: W): Observable<U>;
}
