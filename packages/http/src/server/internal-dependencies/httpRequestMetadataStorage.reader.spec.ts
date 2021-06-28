import { createContext } from '@marblejs/core';
import { createUuid } from '@marblejs/core/dist/+internal/utils';
import { HttpRequestMetadata } from '../../http.interface';
import { HttpRequestMetadataStorage } from './httpRequestMetadataStorage.reader';

describe('#HttpRequestMetadataStorage', () => {
  const storage = HttpRequestMetadataStorage(createContext());

  test('sets => gets => removes value from storage', () => {
    const id = createUuid();
    const metadata: HttpRequestMetadata = { test: 'test_data' };

    expect(storage.size()).toEqual(0);

    storage.set(id, metadata);

    expect(storage.size()).toEqual(1);

    const retrievedData = storage.get(id);

    expect(retrievedData).toEqual(metadata);
    expect(storage.size()).toEqual(0);
  });
});
