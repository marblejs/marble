import { useContext } from '@marblejs/core';
import * as O from 'fp-ts/lib/Option';
import { constant, pipe } from 'fp-ts/lib/function';
import { map } from 'rxjs/operators';
import { HttpRequestMetadataStorageToken } from '../server/internal-dependencies/httpRequestMetadataStorage.reader';
import { getHttpRequestMetadataIdHeader } from '../+internal/metadata.util';
import { HttpOutputEffect } from './http.effects.interface';

export const requestMetadata$: HttpOutputEffect = (out$, ctx) => {
  const httpRequestMetadataStorage = useContext(HttpRequestMetadataStorageToken)(ctx.ask);

  return out$.pipe(
    map(({ req, res }) => pipe(
      getHttpRequestMetadataIdHeader(req.headers),
      O.fold(constant(res), requestId => {
        httpRequestMetadataStorage.set(requestId, req.meta);
        return res;
      }),
    )),
  );
};
