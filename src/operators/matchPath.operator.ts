import * as pathToRegexp from 'path-to-regexp';
import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HttpRequest } from '../http.interface';

export const matchPath = (path: string) => (source$: Observable<HttpRequest>) =>
  source$.pipe(
    filter(req => pathToRegexp(path).test(req.url!))
  );
