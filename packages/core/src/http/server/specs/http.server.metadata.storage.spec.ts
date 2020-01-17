import { createContext } from '../../../context/context.factory';
import { createUuid } from '../../../+internal/utils';
import { HttpRequestMetadata } from '../../http.interface';
import { httpRequestMetadataStorage } from '../http.server.metadata.storage';

describe('#httpRequestMetadataStorage', () => {
  const storage = httpRequestMetadataStorage(createContext());

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
