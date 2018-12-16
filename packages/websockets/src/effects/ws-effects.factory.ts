import { WebSocketEffect } from './ws-effects.interface';
import { coreErrorFactory, CoreErrorOptions } from '@marblejs/core';
import { WebSocketRoute } from '../router/ws-router.interface';

export namespace WebSocketEffectFactory {

  const coreErrorOptions: CoreErrorOptions =  { contextMethod: 'WsEffectFactory' };

  export const matchType = (type: string) => {
    if (!type) {
      throw coreErrorFactory('Type cannot be empty', coreErrorOptions);
    }

    return { use: use(type) };
  };

  const use = (type: string) => (effect: WebSocketEffect): WebSocketRoute => {
    if (!effect) {
      throw coreErrorFactory('Effect needs to be provided', coreErrorOptions);
    }

    return { type, effect };
  };

}
