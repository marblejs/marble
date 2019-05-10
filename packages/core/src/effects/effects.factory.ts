import { HttpMethod, HttpMethodType } from '../http.interface';
import { HttpEffect } from './http-effects.interface';
import { RouteEffect } from '../router/router.interface';
import { coreErrorFactory, CoreErrorOptions } from '../error/error.factory';
import { getArrayFromEnum } from '../+internal';

const httpMethods = getArrayFromEnum(HttpMethodType);
const coreErrorOptions: CoreErrorOptions =  { contextMethod: 'EffectFactory' };

export const EffectFactory = {
   matchPath: (path: string) => {
    if (!path) {
      throw coreErrorFactory('Path cannot be empty', coreErrorOptions);
    }

    return { matchType: EffectFactory.matchType(path) };
  },

  matchType: (path: string) => (method: HttpMethod) => {
    if (!method) {
      throw coreErrorFactory('HttpMethod needs to be defined', coreErrorOptions);
    }

    if (!httpMethods.includes(method)) {
      throw coreErrorFactory(
        `HttpMethod needs to be one of the following: ${httpMethods}`,
        coreErrorOptions,
      );
    }

    return { use: EffectFactory.use(path)(method) };
  },

  use: (path: string) => (method: HttpMethod) => (effect: HttpEffect): RouteEffect => {
    if (!effect) {
      throw coreErrorFactory('Effect needs to be provided', coreErrorOptions);
    }

    return { path, method, effect };
  },
}
