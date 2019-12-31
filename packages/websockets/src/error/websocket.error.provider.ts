import { isNullable } from '@marblejs/core/dist/+internal/utils';
import { EventTransformer } from '../transformer/websocket.transformer.interface';
import { WsErrorEffect } from '../effects/websocket.effects.interface';
import { error$ as defaultError$ } from './websocket.error.effect';

export const provideErrorEffect = (
  errorEffect: WsErrorEffect<any, any, any> | undefined,
  eventTransformer: EventTransformer<any, any> | undefined,
) =>
  !errorEffect && isNullable(eventTransformer)
    ? defaultError$
    : errorEffect;
