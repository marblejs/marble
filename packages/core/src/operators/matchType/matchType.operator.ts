import { Observable } from 'rxjs';
import { filter, tap } from 'rxjs/operators';
import { HttpMethod, HttpRequest } from '../../http.interface';
import { isRequestNotMatched, matchGuard } from '../../util/matcher.guard';

export const matchType = (method: HttpMethod | '*') => (source$: Observable<HttpRequest>) =>
  source$.pipe(
    filter(isRequestNotMatched),
    filter(req => matchGuard(req.method === method || method === '*')(req)),
    tap(req => (req.matchType = true)),
  );
