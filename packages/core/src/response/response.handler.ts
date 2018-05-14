import { EffectResponse } from '../effects/effects.interface';
import { HttpResponse, HttpStatus } from '../http.interface';
import { headersFactory } from './responseHeaders.factory';

export const handleResponse = (res: HttpResponse) => (effect: EffectResponse) => {
  const status = effect.status || HttpStatus.OK;
  res.writeHead(status, headersFactory(effect.headers));
  res.end(JSON.stringify(effect.body));
};
