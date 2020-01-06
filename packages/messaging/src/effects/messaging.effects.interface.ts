import { Effect, Event } from '@marblejs/core';
import { TransportLayerConnection, TransportMessage } from '../transport/transport.interface';

type MsgClient = TransportLayerConnection;

export interface MsgMiddlewareEffect<
  I = Event,
  O = Event,
> extends MsgEffect<I, O> {}

export interface MsgErrorEffect<
  I = Event,
  Err extends Error = Error,
> extends MsgEffect<{ event?: I; error: Err }, any, MsgClient> {}

export interface MsgEffect<
  I = Event,
  O = Event,
  Client = MsgClient,
> extends Effect<I, O, Client> {}

export interface MsgOutputEffect<
  I = Event,
  O = Event,
> extends MsgEffect<{ event: I; initiator: TransportMessage<any> }, O> {}

export interface MsgServerEffect<T extends Event = Event>
  extends MsgEffect<T, any, undefined> {}
