import * as http from 'http';
import { Event, Effect } from '@marblejs/core';
import { WebSocketClientConnection } from '../server/websocket.server.interface';

export interface WsMiddlewareEffect<
  I = Event,
  O = Event,
> extends WsEffect<I, O> {}

export interface WsErrorEffect<
  Err extends Error = Error,
> extends WsEffect<Err, Event> {}

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
