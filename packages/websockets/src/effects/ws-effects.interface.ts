import * as http from 'http';
import { Observable } from 'rxjs';
import { WebSocketEvent, MarbleWebSocketClient } from '../websocket.interface';

export interface WebSocketMiddleware<
  I = WebSocketEvent,
  O = WebSocketEvent,
> extends WebSocketEffect<I, O> {}

export interface WebSocketErrorEffect<
  T extends Error = Error,
  U = WebSocketEvent,
  V = WebSocketEvent
> extends WebSocketEffect<U, V, MarbleWebSocketClient, T> {}

export interface WebSocketConnectionEffect<
  T extends http.IncomingMessage = http.IncomingMessage
> extends WebSocketEffect<T, T, MarbleWebSocketClient> {}

export interface WebSocketEffect<
  T = WebSocketEvent,
  U = WebSocketEvent,
  V = MarbleWebSocketClient,
  W = any,
> {
  (input$: Observable<T>, client: V, meta?: W): Observable<U>;
}
