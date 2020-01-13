import * as Busboy from 'busboy';
import { HttpRequest, HttpError, HttpStatus, isHttpError } from '@marblejs/core';
import { fromEvent, Observable, of, throwError, merge } from 'rxjs';
import { mapTo, mergeMap, tap, mergeMapTo, takeUntil, last, catchError } from 'rxjs/operators';
import { ParserOpts } from './multipart.interface';
import { parseField } from './multipart.parser.field';
import { parseFile } from './multipart.parser.file';

export const parseMultipart = (opts: ParserOpts) => (req: HttpRequest): Observable<HttpRequest> => {
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      fileSize: opts.maxFileSize,
      files: opts.maxFileCount,
      fields: opts.maxFieldCount,
      fieldSize: opts.maxFieldSize,
    },
  });

  const parseFile$ = parseFile(req)(opts)(
    fromEvent(busboy, 'file'),
    fromEvent(busboy, 'finish'),
  );

  const parseField$ = parseField(req)(
    fromEvent(busboy, 'field'),
    fromEvent(busboy, 'finish'),
  );

  const filesLimit$ = fromEvent(busboy, 'filesLimit').pipe(
    takeUntil(fromEvent(busboy, 'finish')),
    mergeMap(() => throwError(
      new HttpError(`Reached max files count limit [${opts.maxFileCount}]`, HttpStatus.PRECONDITION_FAILED, undefined, req),
    )),
  );

  const fieldsLimit$ = fromEvent(busboy, 'fieldsLimit').pipe(
    takeUntil(fromEvent(busboy, 'finish')),
    mergeMap(() => throwError(
      new HttpError(`Reached max fields count limit [${opts.maxFieldCount}]`, HttpStatus.PRECONDITION_FAILED, undefined, req),
    )),
  );

  return of(req).pipe(
    tap(req => req.pipe(busboy)),
    mergeMapTo(merge(
      filesLimit$,
      fieldsLimit$,
      parseFile$,
      parseField$,
    )),
    last(),
    mapTo(req),
    catchError((error: Error) =>
      isHttpError(error)
        ? throwError(error)
        : throwError(new HttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR, undefined, req))
    ),
  );
}
