import * as Busboy from '@fastify/busboy';
import { HttpRequest, HttpError, HttpStatus, isHttpError } from '@marblejs/http';
import { fromEvent, Observable, throwError, forkJoin } from 'rxjs';
import { map, mergeMap, takeUntil, catchError, share, defaultIfEmpty } from 'rxjs/operators';
import { ParserOpts } from './multipart.interface';
import { parseField, FieldEvent } from './multipart.parser.field';
import { parseFile, FileEvent } from './multipart.parser.file';

export const parseMultipart = (opts: ParserOpts) => (req: HttpRequest): Observable<HttpRequest> => {
  const busboy = new Busboy.Busboy({
    headers: req.headers as Busboy.BusboyHeaders,
    limits: {
      fileSize: opts.maxFileSize,
      files: opts.maxFileCount,
      fields: opts.maxFieldCount,
      fieldSize: opts.maxFieldSize,
    },
  });

  const finish$ = fromEvent(busboy, 'finish').pipe(
    share(),
  );

  const parseFile$ = parseFile(req)(opts)(
    fromEvent(busboy, 'file') as Observable<FileEvent>,
    finish$,
  );

  const parseField$ = parseField(req)(
    fromEvent(busboy, 'field') as Observable<FieldEvent>,
    finish$,
  );

  const filesLimit$ = fromEvent(busboy, 'filesLimit').pipe(
    takeUntil(finish$),
    mergeMap(() => throwError(() =>
      new HttpError(`Reached max files count limit [${opts.maxFileCount}]`, HttpStatus.PRECONDITION_FAILED, undefined, req),
    )),
    defaultIfEmpty(true),
  );

  const fieldsLimit$ = fromEvent(busboy, 'fieldsLimit').pipe(
    takeUntil(finish$),
    mergeMap(() => throwError(() =>
      new HttpError(`Reached max fields count limit [${opts.maxFieldCount}]`, HttpStatus.PRECONDITION_FAILED, undefined, req),
    )),
    defaultIfEmpty(true),
  );

  req.pipe(busboy);

  return forkJoin([
    filesLimit$,
    fieldsLimit$,
    parseFile$,
    parseField$,
  ]).pipe(
    map(() => req),
    catchError((error: Error) => isHttpError(error)
      ? throwError(() => error)
      : throwError(() => new HttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR, undefined, req))
    ),
  );
};
