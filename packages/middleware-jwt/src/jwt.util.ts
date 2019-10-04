import * as O from 'fp-ts/lib/Option';
import { pipe } from 'fp-ts/lib/pipeable';
import { HttpRequest } from '@marblejs/core';

const splitHeader = (header: string) => header.split(' ');
const getLastElement = (array: string[]) => array[array.length - 1];

export const parseAuthorizationHeader = (req: HttpRequest) => pipe(
  O.fromNullable(req.headers.authorization),
  O.map(splitHeader),
  O.map(getLastElement),
  O.getOrElse(() => ''),
);

