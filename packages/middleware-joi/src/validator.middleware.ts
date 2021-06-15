/* eslint-disable import/no-duplicates */

import * as Joi from 'joi';
import './validator.interface';
import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { from, of, throwError, Observable } from 'rxjs';
import { mergeMap, catchError, mapTo, switchMap, toArray, map } from 'rxjs/operators';
import { Schema, SchemaValidator } from './validator.schema';
import { ExtractedBody, ExtractedParams, ExtractedQuery } from './validator.interface';

const validateSource = (rules: Map<string, any>, options: Joi.ValidationOptions) => (req: HttpRequest) =>
  from(rules.keys()).pipe(
    mergeMap(rule => of(req[rule]).pipe(
      mergeMap(item =>
        from(Joi.validate(item || {}, rules.get(rule), options)).pipe(
          catchError((err: Joi.ValidationError) => {
            const message = err.details[0].message;
            return throwError(() => new HttpError(message, HttpStatus.BAD_REQUEST));
          })
        )
      ),
      map(result => (req[rule] = result))
    )),
    toArray(),
    mapTo(req)
  );

/**
 * @deprecated [#1] since version 2.0,
 * [#2] use @marblejs/middlware-io instead,
 */
export const validator$ = <TBody = any, TParams = any, TQuery = any>
  (schema: Partial<Schema<TBody, TParams, TQuery>>, options: Joi.ValidationOptions = {}) =>
  (req$: Observable<HttpRequest>) => {
    console.warn('Deprecation warning: @marblejs/middleware-joi is deprecated since v2.0. Use @marblejs/middlware-io instead.');

    const result = Joi.validate(schema, SchemaValidator);
    const rules = Object.keys(schema).reduce(
      (acc, value) => acc.set(value, Joi.compile(schema[value])),
      new Map()
    );

    if (result && result.error) {
      return throwError(() => result.error);
    }

    return req$.pipe(
      switchMap(validateSource(rules, options)),
      map(req => req as HttpRequest<
        ExtractedBody<Required<typeof schema>>,
        ExtractedParams<Required<typeof schema>>,
        ExtractedQuery<Required<typeof schema>>
      >),
    );
  };
