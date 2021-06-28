import * as t from 'io-ts';
import { HttpError, HttpRequest, HttpStatus } from '@marblejs/http';
import { isTestingMetadataOn } from '@marblejs/core/dist/+internal/testing';
import { pipe } from 'fp-ts/lib/function';
import { forkJoin, Observable, of, throwError } from 'rxjs';
import { catchError, map, mergeMap, tap } from 'rxjs/operators';
import { ioTypeToJsonSchema, mergeJsonObjects } from './io.json-schema';
import { Schema, validator$, ValidatorOptions } from './io.middleware';
import { IOError } from './io.error';

interface RequestSchema<TBody extends Schema, TParams extends Schema, TQuery extends Schema> {
  body?: TBody;
  params?: TParams;
  query?: TQuery;
  headers?: Schema;
}

enum Context {
  BODY = 'body',
  PARAMS = 'params',
  QUERY = 'query',
  HEADERS = 'headers',
}

const unknown$ = (i$: Observable<unknown>) => i$;

export const requestValidator$ = <
  TBody extends Schema = t.UnknownC,
  TParams extends Schema = t.UnknownC,
  TQuery extends Schema = t.UnknownC,
>(schema: RequestSchema<TBody, TParams, TQuery>, options: ValidatorOptions = {}) => {
  const bodyValidator$ = schema.body ? validator$(schema.body, { ...options, context: Context.BODY }) : unknown$;
  const paramsValidator$ = schema.params ? validator$(schema.params, { ...options, context: Context.PARAMS }) : unknown$;
  const queryValidator$ = schema.query ? validator$(schema.query, { ...options, context: Context.QUERY }) : unknown$;
  const headersValidator$ = schema.headers ? validator$(schema.headers, { ...options, context: Context.HEADERS }) : unknown$;

  const addMetadata = (req: HttpRequest, name: keyof typeof schema) => {
    req.meta = {
      ...req.meta,
      [name]: mergeJsonObjects(
        req.meta && req.meta[name],
        ioTypeToJsonSchema(schema[name]),
      ),
    };
  };

  return <T extends HttpRequest>(req$: Observable<T>) => req$.pipe(
    tap(req => {
      if (isTestingMetadataOn()) {
        addMetadata(req, 'body');
        addMetadata(req, 'params');
        addMetadata(req, 'query');
        addMetadata(req, 'headers');
      }
    }),
    mergeMap(req => pipe(
      forkJoin([
        bodyValidator$(of(req.body)),
        paramsValidator$(of(req.params)),
        queryValidator$(of(req.query)),
        headersValidator$(of(req.headers)),
      ]),
      map(([body, params, query]) => {
        req.body = body;
        req.params = params;
        req.query = query;
        return req as HttpRequest<
          (typeof schema.body extends t.UnknownC | undefined | null ? unknown : t.TypeOf<TBody>) & T['body'],
          (typeof schema.params extends t.UnknownC | undefined | null ? unknown : t.TypeOf<TParams>) & T['params'],
          (typeof schema.query extends t.UnknownC | undefined | null ? unknown : t.TypeOf<TQuery>) & T['query']
        >;
      }),
      catchError((error: IOError) => throwError(() =>
        new HttpError(error.message, HttpStatus.BAD_REQUEST, error.data, req, error.context),
      )),
    )),
  );
};
