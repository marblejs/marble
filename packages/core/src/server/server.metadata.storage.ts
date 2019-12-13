import * as R from 'fp-ts/lib/Reader';
import { pipe } from 'fp-ts/lib/pipeable';
import { reader } from '../context/context.factory';
import { HttpRequestMetadata } from '../http.interface';

export type ServerRequestMetadataStorage = ReturnType<typeof serverRequestMetadataStorage>;

export const serverRequestMetadataStorage = pipe(reader, R.map(() => {
  const storage = new Map<string, HttpRequestMetadata>();

  const set = (key: string | undefined, metadata: HttpRequestMetadata | undefined) => {
    if (key && metadata) {
      storage.set(key, metadata);
    }
  }

  const get = (key: string) => {
    const metadata = storage.get(key);
    storage.delete(key);
    return metadata;
  }

  return {
    set,
    get,
  }
}));
