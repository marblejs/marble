import { Effect, Event } from '@marblejs/core';

type MsgClient = any; // @TODO

export interface MsgMiddlewareEffect<
  I = Event,
  O = Event,
> extends MsgEffect<I, O> {}

export interface MsgErrorEffect<
  Err extends Error = Error,
  I = Event,
  O = Event
> extends MsgEffect<I, O, MsgClient, Err> {}

export interface MsgEffect<
  I = Event,
  O = Event,
  Client = MsgClient,
  Err extends Error = Error,
> extends Effect<I, O, Client, Err> {}
