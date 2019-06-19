import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { isNonNullable } from '@marblejs/core/dist/+internal/utils';
import { fromReadableStream } from '@marblejs/core/dist/+internal/observable';
import { fromEvent, Observable, of, throwError, merge } from 'rxjs';
import { mapTo, map, mergeMap, takeUntil, toArray, tap, catchError, buffer, mergeMapTo, take, ignoreElements } from 'rxjs/operators';
import * as Busboy from 'busboy';
import { Readable } from 'stream';

type FileEvent = [string, NodeJS.ReadableStream, string, string, string];

type FieldEvent = [string, any, boolean, boolean, string, string];

type FileData = {
  file: NodeJS.ReadableStream;
  filename: string;
  fieldname: string;
  encoding: string;
  mimetype: string;
};

export interface StreamHandler {
  (opts: FileData): Promise<{ destination: any }> | Observable<{ destination: any }>;
}

export interface ParserOpts {
  stream?: StreamHandler;
  maxFileSize?: number;
  maxFileCount?: number;
}

const fileSizeLimit = (data: FileData, maxBytes: number | undefined) =>
  fromEvent(data.file, 'limit').pipe(
    take(1),
    mergeMapTo(throwError(
      new HttpError(`Reached file size limit for "${data.fieldname}" [${maxBytes} bytes]`, HttpStatus.PRECONDITION_FAILED),
    )),
    ignoreElements(),
  );

const parseFile = (req: HttpRequest) => (opts: ParserOpts) => (event$: Observable<FileEvent>, finish$: Observable<any>) =>
  event$.pipe(
    takeUntil(finish$),
    map(([ fieldname, file, filename, encoding, mimetype ]) => ({ fieldname, file, filename, encoding, mimetype })),
    mergeMap((data) => merge(fileSizeLimit(data, opts.maxFileSize), of(data))),
    mergeMap(data => isNonNullable(opts.stream)
      ? of(data).pipe(
          mergeMap(opts.stream),
          catchError(error => throwError(new HttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR))),
          tap(({ destination }) => {
            req.file = {
              ...req.file || {},
              [data.fieldname]: {
                destination,
                encoding: data.encoding,
                mimetype: data.mimetype,
                filename: data.filename,
                fieldname: data.fieldname,
              },
            };
          }),
          mapTo(data),
        )
      : of(data.file as Readable).pipe(
          mergeMap(fromReadableStream),
          toArray(),
          map(chunks => Buffer.concat(chunks)),
          catchError(error => throwError(new HttpError(error.message, HttpStatus.INTERNAL_SERVER_ERROR))),
          tap(buffer => {
            req.file = {
              ...req.file || {},
              [data.fieldname]: {
                buffer,
                encoding: data.encoding,
                mimetype: data.mimetype,
                filename: data.filename,
                fieldname: data.fieldname,
                size: Buffer.byteLength(buffer),
              },
            };
          }),
          mapTo(data),
        ),
    ),
  );

const parseField = (req: HttpRequest) => (event$: Observable<FieldEvent>, finish$: Observable<any>) =>
  event$.pipe(
    takeUntil(finish$),
    tap(([ fieldname, value ]) => {
      req.body = {
        ...req.body || {},
        [fieldname]: value,
      };
    }),
  );

export const parseMultipart = (opts: ParserOpts = {}) => (req: HttpRequest): Observable<HttpRequest> => {
  const busboy = new Busboy({
    headers: req.headers,
    limits: {
      fileSize: opts.maxFileSize,
      files: opts.maxFileCount,
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
    mergeMap(() => throwError(
      new HttpError(`Reached max files count limit [${opts.maxFileCount}]`, HttpStatus.PRECONDITION_FAILED),
    )),
  );

  return of(req).pipe(
    tap(() => req.pipe(busboy)),
    mergeMapTo(merge(parseFile$, parseField$, filesLimit$)),
    buffer(fromEvent(busboy, 'finish')),
    mapTo(req),
  );
}
