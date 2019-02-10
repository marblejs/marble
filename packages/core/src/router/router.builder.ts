import { Either, left, right } from 'fp-ts/lib/Either';
import { HttpMiddlewareEffect, HttpEffect } from '../effects/http-effects.interface';
import { combineMiddlewares } from '../effects/effects.combiner';
import { coreErrorFactory } from '../error/error.factory';
import { HttpMethod } from '../http.interface';
import { RouteEffect } from './router.interface';
import { CoreError } from '../error/error.model';

type Pipeable = (route: Either<CoreError, Partial<RouteEffect>>) => Either<CoreError, Partial<RouteEffect>>;

const pipe = (
  fn1: Pipeable,
  fn2: Pipeable,
  fn3: Pipeable,
  ...fns: Array<Pipeable>
) => {
  const initial = right<CoreError, Partial<RouteEffect>>({});
  const pipeable = [fn1, fn2, fn3, ...fns];
  const piped = pipeable.reduce(
    (prevFn, nextFn) => value => nextFn(prevFn(value)),
    value => value,
  );

  return piped(initial)
    .getOrElseL(error => { throw error; }) as RouteEffect;
};

const matchPath = (path: string): Pipeable => route =>
  !!path
    ? route.map(r => ({ ...r, path }))
    : left(coreErrorFactory('Route path has to be defined', { contextMethod: 'matchPath'}));

const matchType = (method: HttpMethod): Pipeable => route =>
  !!method
    ? route.map(r => ({ ...r, method }))
    : left(coreErrorFactory('HttpMethod has to be defined', { contextMethod: 'matchType'}));

const use = (middleware: HttpMiddlewareEffect): Pipeable => route =>
  !!middleware
    ? route.map(r => ({
        ...r,
        middleware: r.middleware
          ? combineMiddlewares(r.middleware, middleware)
          : combineMiddlewares(middleware)
      }))
    : left(coreErrorFactory('Middleware has to be defined', { contextMethod: 'use'}));

const useEffect = (effect: HttpEffect): Pipeable => route =>
  !!effect
    ? route.map(r => ({ ...r, effect }))
    : left(coreErrorFactory('Effect has to be defined', { contextMethod: 'useEffect'}));

export const r = { pipe, matchPath, matchType, useEffect, use };
