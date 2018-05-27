import * as Joi from 'joi';
import { Schema, SchemaValidator } from './schema';
import { Effect, HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { from, of, throwError } from 'rxjs';
import {
  mergeMap,
  flatMap,
  catchError,
  mapTo,
  switchMap,
  toArray,
  map
} from 'rxjs/operators';

const validateSource = (req: HttpRequest, rules: Map<string, any>, options) =>
  from(rules.keys()).pipe(
    mergeMap(rule =>
      of(req[rule]).pipe(
        flatMap(item =>
          from(Joi.validate(item || {}, rules.get(rule), options)).pipe(
            catchError((err: Joi.ValidationError) => {
              const message = err.details[0].message;
              return throwError(new HttpError(message, HttpStatus.BAD_REQUEST));
            })
          )
        ),
        map(result => (req[rule] = result))
      )
    ),
    toArray(),
    mapTo(req)
  );

const validator$ = (
  schema: Schema,
  options: Joi.ValidationOptions = {}
): Effect<HttpRequest> => request$ => {
  const result = Joi.validate(schema, SchemaValidator);
  const rules = Object.keys(schema).reduce(
    (acc, value) => acc.set(value, Joi.compile(schema[value])),
    new Map()
  );

  if (result && result.error) {
    return throwError(result.error);
  }

  return request$.pipe(switchMap(req => validateSource(req, rules, options)));
};

export { Joi, validator$ };
