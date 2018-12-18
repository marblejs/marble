import { Observable } from 'rxjs';
import { WebSocketEvent, ExtendedWebSocketClient } from '../websocket.interface';

export interface WebSocketMiddleware<
  I = WebSocketEvent,
  O = WebSocketEvent,
> extends WebSocketEffect<I, O> {}

export interface WebSocketErrorEffect<
  T extends Error = Error,
  U = WebSocketEvent,
  V = WebSocketEvent
> extends WebSocketEffect<U, V, ExtendedWebSocketClient, T> {}

export interface WebSocketEffect<
  T = WebSocketEvent,
  U = WebSocketEvent,
  V = ExtendedWebSocketClient,
  W = any,
> {
  (input$: Observable<T>, client?: V, meta?: W): Observable<U>;
}
