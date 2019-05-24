import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { mergeMap, map, catchError } from 'rxjs/operators';
import { Schema, ValidatorOptions, validator$ } from './io.middleware';
import { IOError } from './io.error';

interface RequestSchema<TBody extends Schema, TParams extends Schema, TQuery extends Schema> {
  body: TBody;
  params: TParams;
  query: TQuery;
  headers: Schema;
}

enum Context {
  BODY = 'body',
  PARAMS = 'params',
  QUERY = 'query',
  HEADERS = 'headers',
}

export const requestValidator$ = <TBody extends Schema, TParams extends Schema, TQuery extends Schema>
  (schema: Partial<RequestSchema<TBody, TParams, TQuery>>, options: ValidatorOptions = {}) => {
    const bodyValidator$ = validator$(schema.body, { ...options, context: Context.BODY });
    const paramsValidator$ = validator$(schema.params, { ...options, context: Context.PARAMS });
    const queryValidator$ = validator$(schema.query, { ...options, context: Context.QUERY });
    const headersValidator$ = validator$(schema.headers, { ...options, context: Context.HEADERS });

    return (req$: Observable<HttpRequest>) =>
      req$.pipe(
        mergeMap(req =>
          forkJoin(
            bodyValidator$(of(req.body as any)),
            paramsValidator$(of(req.params as any)),
            queryValidator$(of(req.query as any)),
            headersValidator$(of(req.headers as any)),
          ).pipe(
            map(([body, params, query]) => {
              req.body = body;
              req.params = params;
              req.query = query;
              return req as HttpRequest<typeof body, typeof params, typeof query>;
            }),
            catchError((error: IOError) => throwError(
              new HttpError(error.message, HttpStatus.BAD_REQUEST, error.data, error.context),
            )),
          )
        ),
      );
  };
