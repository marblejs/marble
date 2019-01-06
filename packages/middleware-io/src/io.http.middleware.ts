import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { Schema, ValidatorOptions, validator$ } from './io.middleware';
import { IOError } from './io.error';

interface HttpSchema<TBody extends Schema, TParams extends Schema, TQuery extends Schema> {
  body: TBody;
  params: TParams;
  query: TQuery;
  headers: Schema;
}

export const httpValidator$ = <TBody extends Schema, TParams extends Schema, TQuery extends Schema>
  (schema: Partial<HttpSchema<TBody, TParams, TQuery>>, options: ValidatorOptions = {}) => {
    const bodyValidator$ = validator$(schema.body, options);
    const paramsValidator$ = validator$(schema.params, options);
    const queryValidator$ = validator$(schema.query, options);
    const headersValidator$ = validator$(schema.headers, options);

    return (req$: Observable<HttpRequest>) =>
      req$.pipe(
        mergeMap(req =>
          forkJoin(
            bodyValidator$(of(req.body as any)),
            paramsValidator$(of(req.params as any)),
            queryValidator$(of(req.query as any)),
            headersValidator$(of(req.headers as any)),
          ).pipe(
            map(([body, params, query]) => req as HttpRequest<typeof body, typeof params, typeof query>),
            catchError((error: IOError) => throwError(
              new HttpError(error.message, HttpStatus.BAD_REQUEST, error.data),
            )),
          )
        ),
      );
  };
