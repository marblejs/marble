import * as http from 'http';
import { Event, Effect } from '@marblejs/core';
import { MarbleWebSocketClient } from '../websocket.interface';

export interface WsMiddleware<
  I = Event,
  O = Event,
> extends WsEffect<I, O> {}

export interface WsErrorEffect<
  T extends Error = Error,
  U = Event,
  V = Event
> extends WsEffect<U, V, MarbleWebSocketClient, T> {}

export interface WsConnectionEffect<
  T extends http.IncomingMessage = http.IncomingMessage
> extends WsEffect<T, T, MarbleWebSocketClient> {}

export interface WsOutputEffect<
  T extends Event = Event
> extends WsEffect<T, Event> {}

export interface WsEffect<
  T = Event,
  U = Event,
  V = MarbleWebSocketClient,
  W extends Error = Error,
> extends Effect<T, U, V, W> {}
