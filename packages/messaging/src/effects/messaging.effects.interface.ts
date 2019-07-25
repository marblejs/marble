import { Effect, Event } from '@marblejs/core';
import { TransportLayerConnection, TransportMessage } from '../transport/transport.interface';

type MsgClient = TransportLayerConnection;

export interface MsgMiddlewareEffect<
  I = Event,
  O = Event,
> extends MsgEffect<I, O> {}

export interface MsgErrorEffect<
  Err extends Error = Error,
> extends MsgEffect<Event, Event, MsgClient, Err> {}

export interface MsgEffect<
  I = Event,
  O = Event,
  Client = MsgClient,
  Err extends Error = Error,
> extends Effect<I, O, Client, Err, TransportMessage<any>> {}

export interface MsgOutputEffect<
  I = Event,
  O = Event,
> extends MsgEffect<I, O> {}

export interface MsgServerEffect<T extends Event = Event>
  extends MsgEffect<T, any, undefined> {}
