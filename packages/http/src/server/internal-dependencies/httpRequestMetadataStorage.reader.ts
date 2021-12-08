import { createContextToken, createReader } from '@marblejs/core';
import * as O from 'fp-ts/lib/Option';
import { constVoid, pipe } from 'fp-ts/lib/function';
import { getHttpRequestMetadataIdHeader } from '../../+internal/metadata.util';
import { HttpEffectResponse } from '../../effects/http.effects.interface';
import { HttpRequestMetadata, WithHttpRequest } from '../../http.interface';

export type HttpRequestMetadataStorage = Readonly<ReturnType<typeof HttpRequestMetadataStorage>>;

export const HttpRequestMetadataStorageToken = createContextToken<HttpRequestMetadataStorage>('HttpRequestMetadataStorage');

export const HttpRequestMetadataStorage = createReader(() => {
  const storage = new Map<string, HttpRequestMetadata>();

  const set = (key: string | undefined, metadata: HttpRequestMetadata | undefined): void => {
    if (key && metadata) storage.set(key, metadata);
  };


  const get = (key: string): HttpRequestMetadata | undefined => {
    const metadata = storage.get(key);
    storage.delete(key);
    return metadata;
  };

  const size = () =>
    storage.size;

  const collect = (response: WithHttpRequest<HttpEffectResponse>): void =>
    pipe(
      getHttpRequestMetadataIdHeader(response.request.headers),
      O.fold(constVoid, requestId => set(requestId, response.request.meta)),
    );

  return {
    /**
     * Gets request metadata for given key (request ID) and removes it from storage
     *
     * @param key request ID
     * @returns HttpRequestMetadata | undefined
     */
    get,

    /**
     * Set request metadata for given key (request ID)
     *
     * @param key request ID
     * @param metadata request metadata
     * @returns void
     */
    set,

    /**
     * @returns total count of stored request metadatas
     */
    size,

    /**
     * Collects request metadata from HttpEffect response
     *
     * @param response HttpEffectResponse & HttpRequest
     * @returns void
     */
    collect,
  };
});
