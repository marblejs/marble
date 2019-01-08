import * as http from 'http';
import { Event } from '@marblejs/core';
import { Observable } from 'rxjs';
import { MarbleWebSocketClient } from '../websocket.interface';

export interface WebSocketMiddleware<
  I = Event,
  O = Event,
> extends WebSocketEffect<I, O> {}

export interface WebSocketErrorEffect<
  T extends Error = Error,
  U = Event,
  V = Event
> extends WebSocketEffect<U, V, MarbleWebSocketClient, T> {}

export interface WebSocketConnectionEffect<
  T extends http.IncomingMessage = http.IncomingMessage
> extends WebSocketEffect<T, T, MarbleWebSocketClient> {}

export interface WebSocketEffect<
  T = Event,
  U = Event,
  V = MarbleWebSocketClient,
  W = any,
> {
  (input$: Observable<T>, client: V, meta?: W): Observable<U>;
}
