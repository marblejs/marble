import * as http from 'http';
import { Event, Effect } from '@marblejs/core';
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

export interface WebSocketOutputEffect<
  T extends Event = Event
> extends WebSocketEffect<T, Event> {}

export interface WebSocketEffect<
  T = Event,
  U = Event,
  V = MarbleWebSocketClient,
  W extends Error = Error,
> extends Effect<T, U, V, W> {}
