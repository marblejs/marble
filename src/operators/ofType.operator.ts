import { Observable } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HttpMethod, HttpRequest } from '../http.interface';

export const ofType = (httpMethodType: HttpMethod) => (source$: Observable<HttpRequest>) =>
  source$.pipe(
    filter(req => req.method === httpMethodType)
  );
