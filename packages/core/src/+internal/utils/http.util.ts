import { pipe } from 'fp-ts/lib/pipeable';
import { toUndefined } from 'fp-ts/lib/Option';
import { HttpRequest } from '../../http/http.interface';
import { getHead } from './array.util';

export const getHeaderValueHead = <T extends string = string>(key: string) => (req: HttpRequest): T | undefined => {
  const header = req.headers[key.toLowerCase()];
  return Array.isArray(header)
    ? pipe(getHead(header), toUndefined) as T
    : header as T;
};
