import { Observable, pipe, of, EMPTY } from 'rxjs';
import { mergeMap, catchError, map } from 'rxjs/operators';
import { pipeFromArray } from '@marblejs/core/dist/+internal/utils';
import { HttpRequest } from '../http.interface';
import { HttpEffectResponse } from '../effects/http.effects.interface';
import { RouteCombinerConfig, RouteEffectGroup, ErrorSubject } from './http.router.interface';

export const isRouteEffectGroup = (item: any): item is RouteEffectGroup =>
  Array.isArray(item.effects) &&
  Array.isArray(item.middlewares);

export const isRouteCombinerConfig = (item: any): item is RouteCombinerConfig =>
  Array.isArray(item.effects);

export const decorateEffect = (stream: Observable<HttpRequest>, errorSubject: ErrorSubject) => {
  stream.pipe = (...operations: any[]): Observable<any> => pipe(
    mergeMap((request: HttpRequest) => pipeFromArray([
      ...operations,
      map((res: HttpEffectResponse) => ({ ...res, request })),
      catchError((error: Error) => {
        errorSubject.next({ error, request });
        return EMPTY;
      }),
    ])(of(request)) as Observable<HttpEffectResponse>),
  )(stream);

  return stream;
};

export const decorateMiddleware = (stream: Observable<HttpRequest>, errorSubject: ErrorSubject) => {
  stream.pipe = (...operations: any[]): Observable<any> => pipe(
    mergeMap((request: HttpRequest) => pipeFromArray([
      ...operations,
      catchError((error: Error) => {
        errorSubject.next({ error, request });
        return EMPTY;
      }),
    ])(of(request)) as Observable<HttpRequest>),
  )(stream);

  return stream;
};
