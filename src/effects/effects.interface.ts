import { Observable } from 'rxjs';
import { HttpRequest, HttpResponse } from '../http.interface';

export type EffectResponse = {
  status: number,
  body?: object,
  headers?: Record<string, string>,
};

export type RequestEffect = (
  request$: Observable<HttpRequest>,
  response?: HttpResponse,
) => Observable<EffectResponse>;
