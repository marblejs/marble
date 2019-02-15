import { fromNullable } from 'fp-ts/lib/Option';
import { HttpRequest } from '@marblejs/core';

const splitHeader = (header: string) => header.split(' ');
const getLastElement = (array: string[]) => array[array.length - 1];

export const parseAuthorizationHeader = (req: HttpRequest) =>
  fromNullable(req.headers.authorization)
    .map(splitHeader)
    .map(getLastElement)
    .getOrElse('');
