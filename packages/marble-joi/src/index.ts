import * as Joi from 'joi';
import { Schema, SchemaValidator } from './schema';
import { Effect, HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { of, Observable, throwError, from, empty } from 'rxjs';
import { tap, switchMap, toArray, map, catchError, mapTo, mergeMap, switchMapTo } from 'rxjs/operators';
import { filter } from 'minimatch';

const validateSource = (req: HttpRequest, rules: Map<string, any>, options) => from(rules.keys()).pipe(
  switchMap(rule => of(req[rule]).pipe(
    mergeMap(item => {
      return typeof item !== 'undefined'
        ? of(item)
        : empty();
    }),
    mergeMap(item => from(Joi.validate(item, rules.get(rule), options))),
    catchError((err: Error) => throwError(new HttpError(err.message, HttpStatus.BAD_REQUEST))),
  )),
  mapTo(req),
);

const validator$ = (schema: Schema, options: Joi.ValidationOptions = {}): Effect<HttpRequest> => request$ => {
  const result = Joi.validate(schema, SchemaValidator);
  const rules = Object.keys(schema).reduce((acc, value) => acc.set(value, Joi.compile(schema[value])), new Map());

  if (result && result.error) {
    return throwError(result.error);
  }

  return request$.pipe(
    tap(req => req.params = req.route ? req.route.params : {}),
    switchMap(req => validateSource(req, rules, options)),
  );
};

export {
  Joi,
  validator$,
};
