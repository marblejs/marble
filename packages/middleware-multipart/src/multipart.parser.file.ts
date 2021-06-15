import { Readable } from 'stream';
import { HttpRequest, HttpError, HttpStatus } from '@marblejs/core';
import { isNonNullable } from '@marblejs/core/dist/+internal/utils';
import { fromReadableStream } from '@marblejs/core/dist/+internal/observable';
import { fromEvent, Observable, of, throwError, merge, iif } from 'rxjs';
import { mapTo, map, mergeMap, takeUntil, toArray, tap, mergeMapTo, ignoreElements, defaultIfEmpty } from 'rxjs/operators';
import { FileIncomingData, ParserOpts } from './multipart.interface';
import { setRequestData, shouldParseFieldname } from './multipart.util';

export type FileEvent = [string, NodeJS.ReadableStream, string, string, string];

const fileSizeLimit = (maxBytes: number | undefined) => (data: FileIncomingData) => (finish$: Observable<any>) =>
  fromEvent(data.file, 'limit').pipe(
    takeUntil(finish$),
    mergeMapTo(throwError(() =>
      new HttpError(`Reached file size limit for "${data.fieldname}" [${maxBytes} bytes]`, HttpStatus.PRECONDITION_FAILED),
    )),
    ignoreElements(),
  );

export const parseFile = (req: HttpRequest) => (opts: ParserOpts) => (event$: Observable<FileEvent>, finish$: Observable<any>) =>
  event$.pipe(
    takeUntil(finish$),
    map(([ fieldname, file, filename, encoding, mimetype ]) => ({ fieldname, file, filename, encoding, mimetype })),
    mergeMap(data => iif(
      () => !shouldParseFieldname(opts.files)(data.fieldname),
      throwError(() => new HttpError(`File "${data.fieldname}" is not acceptable`, HttpStatus.PRECONDITION_FAILED)),
      of(data),
    )),
    mergeMap(data => merge(fileSizeLimit(opts.maxFileSize)(data)(finish$), of(data))),
    mergeMap(data => isNonNullable(opts.stream)
      ? of(data).pipe(
          mergeMap(opts.stream),
          tap(setRequestData(req)(data)),
          tap(() => data.file.resume()),
          mapTo(data),
        )
      : of(data).pipe(
          map(data => data.file as Readable),
          mergeMap(fromReadableStream),
          toArray(),
          map(chunks => ({ buffer: Buffer.concat(chunks) })),
          map(({ buffer }) => ({ buffer, size: Buffer.byteLength(buffer) })),
          tap(setRequestData(req)(data)),
          tap(() => data.file.resume()),
          mapTo(data),
        ),
    ),
    mapTo(req),
    defaultIfEmpty(req),
  );
