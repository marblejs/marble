import { throwError } from 'rxjs';
import { mergeMapTo } from 'rxjs/operators';
import { r } from './router.ixbuilder';
import { HttpError } from '../error/error.model';
import { HttpStatus } from '../http.interface';

export const ROUTE_NOT_FOUND_ERROR = new HttpError('Route not found', HttpStatus.NOT_FOUND);

export const notFound$ = r.pipe(
  r.matchPath('*'),
  r.matchType('*'),
  r.useEffect(req$ => req$.pipe(mergeMapTo(throwError(ROUTE_NOT_FOUND_ERROR)))),
  r.applyMeta({ overridable: true }));
