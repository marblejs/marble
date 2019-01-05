import * as t from 'io-ts';
import { Reporter } from 'io-ts/lib/Reporter';
import { Either } from 'fp-ts/lib/Either';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { map, mergeMap, catchError } from 'rxjs/operators';
import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { defaultReporter } from './io.reporter';
import { IOError } from './io.error';

type Schema =
  | t.InterfaceType<any, any, any, any>
  | t.RecursiveType<any, any, any, any>
  ;

interface HttpSchema<TBody extends Schema, TParams extends Schema, TQuery extends Schema> {
  body: TBody;
  params: TParams;
  query: TQuery;
  headers: Schema;
}

export interface ValidatorOptions {
  reporter?: Reporter<any>;
}

const validateError = (reporter: Reporter<any> = defaultReporter) => (result: Either<t.Errors, any>) =>
  result.getOrElseL(() => {
    throw new IOError('Validation error', reporter.report(result));
  });

export const validator$ = <U extends Schema, T>
  (schema: U | undefined, options: ValidatorOptions = {}) => (i$: Observable<T>) =>
    !!schema ? i$.pipe(
      map(input => schema.decode(input)),
      map(validateError(options.reporter)),
      map(input => input as t.TypeOf<typeof schema>),
    ) : i$;

export const httpValidator$ = <TBody extends Schema, TParams extends Schema, TQuery extends Schema>
  (schema: Partial<HttpSchema<TBody, TParams, TQuery>>, options: ValidatorOptions = {}) =>
  (req$: Observable<HttpRequest>) =>
    req$.pipe(
      mergeMap(req =>
        forkJoin(
          validator$(schema.body, options)(of(req.body as any)),
          validator$(schema.params, options)(of(req.params as any)),
          validator$(schema.query, options)(of(req.query as any)),
          validator$(schema.headers, options)(of(req.headers as any)),
        ).pipe(
          map(([body, params, query]) => req as HttpRequest<typeof body, typeof params, typeof query>),
          catchError((error: IOError) => throwError(
            new HttpError(error.message, HttpStatus.BAD_REQUEST, error.data),
          )),
        )
      ),
    );
