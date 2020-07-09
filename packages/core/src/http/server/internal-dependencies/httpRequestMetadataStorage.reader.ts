import { HttpRequestMetadata } from '../../http.interface';
import { createReader } from '../../../context/context.reader.factory';
import { createContextToken } from '../../../context/context.token.factory';

export type HttpRequestMetadataStorage = ReturnType<typeof HttpRequestMetadataStorage>;

export const HttpRequestMetadataStorageToken = createContextToken<HttpRequestMetadataStorage>('HttpRequestMetadataStorage');

export const HttpRequestMetadataStorage = createReader(() => {
  const storage = new Map<string, HttpRequestMetadata>();

  const set = (key: string | undefined, metadata: HttpRequestMetadata | undefined) => {
    if (key && metadata) storage.set(key, metadata);
  }

  const get = (key: string) => {
    const metadata = storage.get(key);
    storage.delete(key);
    return metadata;
  }

  const size = () =>
    storage.size;

  return {
    set,
    get,
    size,
  }
});
