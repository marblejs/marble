import { HttpRequest, internal as i } from '@marblejs/core';

const splitHeader = (header: string) => header.split(' ');
const getLastElement = (array: string[]) => array[array.length - 1];

export const parseAuthorizationHeader = (req: HttpRequest) =>
  i.Maybe.of(req.headers.authorization)
    .map(splitHeader)
    .map(getLastElement)
    .valueOr('');
