import { Observable, throwError } from 'rxjs';
import { mergeMap, map } from 'rxjs/operators';
import { HttpRequest, HttpError, HttpStatus } from '@marblejs/http';
import { ContentType } from '@marblejs/http/dist/+internal/contentType.util';
import { parseMultipart } from './multipart.parser';
import { shouldParseMultipart } from './multipart.util';
import { WithFile, ParserOpts } from './multipart.interface';

export const multipart$ = <File extends string>(opts: ParserOpts = {}) => <T extends HttpRequest>(req$: Observable<T>) =>
  req$.pipe(
    mergeMap(req => shouldParseMultipart(req)
      ? parseMultipart(opts)(req)
      : throwError(() =>
        new HttpError(`Content-Type must be of type ${ContentType.MULTIPART_FORM_DATA}`, HttpStatus.PRECONDITION_FAILED, undefined, req)
      )),
    map(req => req as T & WithFile<File>),
  );
