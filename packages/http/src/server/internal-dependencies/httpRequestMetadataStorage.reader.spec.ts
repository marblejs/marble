import { createContext } from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { HttpEffectResponse, HttpRequest } from '../..';
import { HTTP_REQUEST_METADATA_ID_HEADER_KEY } from '../../+internal/metadata.util';
import { HttpRequestMetadata, WithHttpRequest } from '../../http.interface';
import { HttpRequestMetadataStorage } from './httpRequestMetadataStorage.reader';

describe('#HttpRequestMetadataStorage', () => {
  test('sets => gets => removes value from storage', () => {
    // given
    const id = createUuid();
    const storage = HttpRequestMetadataStorage(createContext());
    const metadata: HttpRequestMetadata = { test: 'test_data' };

    expect(storage.size()).toEqual(0);

    // when
    storage.set(id, metadata);

    // then
    expect(storage.size()).toEqual(1);
    expect(storage.get(id)).toEqual(metadata);
    expect(storage.size()).toEqual(0);
  });

  test('collects metadata from request', () => {
    // given
    const storage = HttpRequestMetadataStorage(createContext());
    const meta: HttpRequestMetadata = { test: 'test_data' };
    const requestId = createUuid();
    const request = { meta, headers: { [HTTP_REQUEST_METADATA_ID_HEADER_KEY]: requestId } } as any as  HttpRequest;
    const response = { request } as WithHttpRequest<HttpEffectResponse>;

    expect(storage.size()).toEqual(0);

    // when
    storage.collect(response);

    // then
    expect(storage.size()).toEqual(1);
    expect(storage.get(requestId)).toEqual(meta);
    expect(storage.size()).toEqual(0);
  });
});
