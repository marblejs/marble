import * as http from 'http';
import { StatusCode } from '../util/status-code.util';
import { Observable, merge } from 'rxjs';
import { RequestEffect } from './effects.interface';
import { HttpRequest, HttpResponse } from '../http.interface';

export const combineEffects = (...effects: RequestEffect[]) => (
  request$: Observable<HttpRequest>,
  response: HttpResponse
) => {
  const mappedEffects = effects.map(effect => effect(request$, response));
  return merge(...mappedEffects);
};
