import { Observable } from 'rxjs';
import { WebSocketEvent, WebSocketType, ExtendedWebSocketClient } from '../websocket.interface';

export interface WebSocketEffectResponse<T = any> {
  type: WebSocketType;
  payload: T;
}

export interface WebSocketMiddleware<
  I extends WebSocketEvent = WebSocketEvent,
  O extends WebSocketEvent = WebSocketEvent,
> extends WebSocketEffect<I, O> {}

export interface WebSocketErrorEffect<T extends Error = Error>
  extends WebSocketEffect<WebSocketEvent, WebSocketEffectResponse, ExtendedWebSocketClient, T> {}

export interface WebSocketEffect<
  T = WebSocketEvent,
  U = WebSocketEffectResponse,
  V = ExtendedWebSocketClient,
  W = any,
> {
  (input$: Observable<T>, client?: V, meta?: W): Observable<U>;
}
