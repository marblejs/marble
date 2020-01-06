import * as http from 'http';
import { Event, Effect } from '@marblejs/core';
import { WebSocketClientConnection } from '../server/websocket.server.interface';

export interface WsMiddlewareEffect<
  I = Event,
  O = Event,
> extends WsEffect<I, O> {}

export interface WsErrorEffect<
  T extends Error = Error,
  U = Event,
  V = Event
> extends WsEffect<{ event?: U; error: T }, V> {}

export interface WsConnectionEffect<
  T extends http.IncomingMessage = http.IncomingMessage
> extends WsEffect<T, T, undefined> {}

export interface WsOutputEffect<
  T extends Event = Event
> extends WsEffect<T, Event> {}

export interface WsEffect<
  T = Event,
  U = Event,
  V = WebSocketClientConnection,
> extends Effect<T, U, V> {}
