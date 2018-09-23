import { HttpRequest } from '@marblejs/core';
import { Maybe } from '@marblejs/core/dist/+internal';

const splitHeader = (header: string) => header.split(' ');
const getLastElement = (array: string[]) => array[array.length - 1];

export const parseAuthorizationHeader = (req: HttpRequest) =>
  Maybe.of(req.headers.authorization)
    .map(splitHeader)
    .map(getLastElement)
    .valueOr('');
