import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import {  Observable, throwError } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { parseMultipart } from './multipart.parser';
import { shouldParseMultipart } from './multipart.util';
import { WithFile, ParserOpts } from './multipart.interface';
import { ContentType } from '@marblejs/core/dist/+internal/http';

export const multipart$ = <File extends string>(opts: ParserOpts = {}) => <T extends HttpRequest>(req$: Observable<T>) =>
  req$.pipe(
    mergeMap(req => shouldParseMultipart(req)
      ? parseMultipart(opts)(req)
      : throwError(
        new HttpError(`Content-Type must be of type ${ContentType.MULTIPART_FORM_DATA}`, HttpStatus.PRECONDITION_FAILED)
      )),
    map(req => req as T & WithFile<File>),
  );
