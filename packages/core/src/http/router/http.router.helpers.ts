import { Observable, pipe, throwError, of } from 'rxjs';
import { pipeFromArray } from 'rxjs/internal/util/pipe';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { HttpRequest, HttpStatus } from '../http.interface';
import { HttpEffectResponse } from '../effects/http.effects.interface';
import { isHttpError, HttpError } from '../error/http.error.model';
import { RouteCombinerConfig, RouteEffectGroup } from './http.router.interface';

export const isRouteEffectGroup = (item: any): item is RouteEffectGroup =>
  Array.isArray(item.effects) &&
  Array.isArray(item.middlewares);

export const isRouteCombinerConfig = (item: any): item is RouteCombinerConfig =>
  Array.isArray(item.effects);

export const decorateEffect = (stream: Observable<HttpRequest>) => {
  stream.pipe = (...operations: any[]): Observable<any> => {
    return pipe(
      mergeMap((request: HttpRequest) => pipeFromArray([
        ...operations,
        map((res: HttpEffectResponse) => ({ ...res, request })),
        catchError((error: Error) =>
          isHttpError(error)
            ? throwError(new HttpError(error.message, error.status, error.data, request, error.context))
            : throwError(new HttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR, undefined, request))
        ),
      ])(of(request)) as Observable<HttpEffectResponse>),
    )(stream);
  };

  return stream;
};

export const decorateMiddleware = (stream: Observable<HttpRequest>) => {
  stream.pipe = (...operations: any[]): Observable<any> => {
    return pipe(
      mergeMap((request: HttpRequest) => pipeFromArray([
        ...operations,
        catchError((error: Error) =>
          isHttpError(error)
            ? throwError(new HttpError(error.message, error.status, error.data, request, error.context))
            : throwError(new HttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR, undefined, request))
        ),
      ])(of(request)) as Observable<HttpRequest>),
    )(stream);
  };

  return stream;
};
