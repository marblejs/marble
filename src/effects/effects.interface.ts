import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse } from '../http.interface';
import { StatusCode } from '../util';

export type EffectResponse = {
  status: StatusCode,
  body?: object,
  headers?: Record<string, string>,
};

export type Effect<T = EffectResponse> = (
  request$: Observable<HttpRequest>,
  response?: HttpResponse,
) => Observable<T>;
