import { promisify } from 'util';
import * as T from 'fp-ts/lib/Task';
import * as E from 'fp-ts/lib/Either';
import { pipe, constTrue } from 'fp-ts/lib/function';
import { Event, EffectContext, useContext } from '@marblejs/core';
import { TransportLayerConnection } from '../transport/transport.interface';
import { EventTimerStore, EventTimerStoreToken } from '../eventStore/eventTimerStore';

const RESEND = true;

const DONT_RESEND = false;

const timeoutTask = () => promisify(setTimeout)(10);

const unregisterTask = (store: EventTimerStore) => (e: Event) => T.fromIO(store.unregister(e));

const ackTask = (ctx: EffectContext<TransportLayerConnection>) => (e: Event): T.Task<void> =>
  pipe(
    E.tryCatch(() => ctx.client.ackMessage(e.metadata?.raw), E.toError),
    E.fold(() => T.of(undefined), () => T.of(undefined)),
  );

const nackTask = (ctx: EffectContext<TransportLayerConnection>) => (e: Event) => (resend: boolean): T.Task<void> =>
  pipe(
    E.tryCatch(() => ctx.client.nackMessage(e.metadata?.raw, resend), E.toError),
    E.fold(() => T.of(undefined), () => T.of(undefined)),
  );

export const ackEvent = (ctx: EffectContext<TransportLayerConnection>) =>
  pipe(
    ctx.ask,
    useContext(EventTimerStoreToken),
    store => (event: Event): T.Task<boolean> =>
      pipe(
        ackTask(ctx)(event),
        T.chain(_ => unregisterTask(store)(event)),
        T.chain(_ => timeoutTask),
        T.map(constTrue),
      ),
  );

export const nackEvent = (ctx: EffectContext<TransportLayerConnection>) =>
  pipe(
    ctx.ask,
    useContext(EventTimerStoreToken),
    store => (event: Event): T.Task<boolean> =>
      pipe(
        nackTask(ctx)(event)(DONT_RESEND),
        T.chain(_ => unregisterTask(store)(event)),
        T.chain(_ => timeoutTask),
        T.map(constTrue),
      ),
  );

export const nackAndResendEvent = (ctx: EffectContext<TransportLayerConnection>) =>
  pipe(
    ctx.ask,
    useContext(EventTimerStoreToken),
    store => (event: Event): T.Task<boolean> =>
      pipe(
        nackTask(ctx)(event)(RESEND),
        T.chain(_ => unregisterTask(store)(event)),
        T.chain(_ => timeoutTask),
        T.map(constTrue),
      ),
  );
