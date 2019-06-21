import { HttpRequest } from '@marblejs/core';
import { of, Observable } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { parseMultipart } from './multipart.parser';
import { shouldParseMultipart } from './multipart.util';
import { WithFile, ParserOpts } from './multipart.interface';

export const multipart$ = <File extends string>(opts: ParserOpts = {}) => <T extends HttpRequest>(req$: Observable<T>) =>
  req$.pipe(
    mergeMap(req => shouldParseMultipart(req)
      ? parseMultipart(opts)(req)
      : of(req)),
    map(req => req as T & WithFile<File>),
  );
