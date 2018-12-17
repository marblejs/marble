import { HttpMethod, HttpMethodType } from '../http.interface';
import { Effect } from './effects.interface';
import { RouteEffect } from '../router/router.interface';
import { coreErrorFactory, CoreErrorOptions } from '../error/error.factory';
import { getArrayFromEnum } from '../+internal';
import { tap } from 'rxjs/operators';

export namespace EffectFactory {

  const httpMethods = getArrayFromEnum(HttpMethodType);
  const coreErrorOptions: CoreErrorOptions =  { contextMethod: 'EffectFactory' };

  export const matchPath = (path: string) => {
    if (!path) {
      throw coreErrorFactory('Path cannot be empty', coreErrorOptions);
    }

    return { matchType: matchType(path) };
  };

  const matchType = (path: string) => (method: HttpMethod) => {
    if (!method) {
      throw coreErrorFactory('HttpMethod needs to be defined', coreErrorOptions);
    }

    if (!httpMethods.includes(method)) {
      throw coreErrorFactory(
        `HttpMethod needs to be one of the following: ${httpMethods}`,
        coreErrorOptions,
      );
    }

    return { use: use(path)(method) };
  };

  const use = (path: string) => (method: HttpMethod) => (effect: Effect): RouteEffect => {
    if (!effect) {
      throw coreErrorFactory('Effect needs to be provided', coreErrorOptions);
    }

    return { path, method, effect: (req$, res, meta) => effect(req$, res, meta).pipe(
      tap(req => console.log(req)),
    )};
  };

}
