import { EventTransformer } from '../transformer/transformer.inteface';
import { WsErrorEffect } from '../effects/ws-effects.interface';
import { error$ as defaultError$ } from './ws-error.effect';

export const provideErrorEffect = (
  errorEffect: WsErrorEffect<any, any, any> | undefined,
  eventTransformer: EventTransformer<any, any> | undefined,
) =>
  !errorEffect && eventTransformer === undefined
    ? defaultError$
    : errorEffect;
