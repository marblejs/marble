import { Observable } from 'rxjs';
import { HttpRequest } from '../http.interface';

export type EffectResponse = {
  status: number,
  body?: object,
  headers?: Record<string, string>,
};

export type RequestEffect = (request$: Observable<HttpRequest>) => Observable<EffectResponse>;
