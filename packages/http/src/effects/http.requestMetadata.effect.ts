import { useContext } from '@marblejs/core';
import * as O from 'fp-ts/lib/Option';
import { constant, pipe } from 'fp-ts/lib/function';
import { map } from 'rxjs/operators';
import { HttpRequestMetadataStorageToken } from '../server/internal-dependencies/httpRequestMetadataStorage.reader';
import { getHttpRequestMetadataIdHeader } from '../+internal/metadata.util';
import { HttpOutputEffect } from './http.effects.interface';

export const requestMetadata$: HttpOutputEffect = (output$, ctx) => {
  const httpRequestMetadataStorage = useContext(HttpRequestMetadataStorageToken)(ctx.ask);

  return output$.pipe(
    map(response => pipe(
      getHttpRequestMetadataIdHeader(response.request.headers),
      O.fold(constant(response), requestId => {
        httpRequestMetadataStorage.set(requestId, response.request.meta);
        return response;
      }),
    )),
  );
};
