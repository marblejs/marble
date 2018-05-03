import { HttpResponse } from '../http.interface';
import { EffectResponse } from '../effects/effects.interface';
import { headersFactory } from './responseHeaders.factory';

export const handleResponse = (res: HttpResponse) => (effect: EffectResponse) => {
  res.writeHead(effect.status, headersFactory(effect.headers));
  res.end(JSON.stringify(effect.body));
};
