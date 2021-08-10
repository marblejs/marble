import * as O from 'fp-ts/lib/Option';
import * as A from 'fp-ts/lib/Array';
import { constant, pipe } from 'fp-ts/lib/function';
import { HttpHeaders } from '../http.interface';

export enum ContentType {
  APPLICATION = 'application/*',
  APPLICATION_RTF = 'application/rtf',
  APPLICATION_ZIP = 'application/zip',
  APPLICATION_X_RAR = 'application/x-rar-compressed',
  APPLICATION_X_TAR = 'application/x-tar',
  APPLICATION_X_TZ_COMPRESSED = 'application/x-7z-compressed',
  APPLICATION_X_WWW_FORM_URLENCODED = 'application/x-www-form-urlencoded',
  APPLICATION_PDF = 'application/pdf',
  APPLICATION_JSON = 'application/json',
  APPLICATION_JAVASCRIPT = 'application/javascript',
  APPLICATION_ECMASCRIPT = 'application/ecmascript',
  APPLICATION_XML = 'application/xml',
  APPLICATION_OCTET_STREAM = 'application/octet-stream',
  APPLICATION_VND_API_JSON = 'application/vnd.api+json',
  TEXT_PLAIN = 'text/plain',
  TEXT_HTML = 'text/html',
  TEXT_CSS = 'text/css',
  TEXT_CSV = 'text/csv',
  IMAGE_WEBP = 'image/webp',
  IMAGE_JPEG = 'image/jpeg',
  IMAGE_PNG = 'image/png',
  IMAGE_GIF = 'image/gif',
  IMAGE_TIFF = 'image/tiff',
  IMAGE_SVG_XML = 'image/svg+xml',
  AUDIO_MPEG = 'audio/mpeg',
  AUDIO_OGG = 'audio/ogg',
  AUDIO = 'audio/*',
  VIDEO_WEBM = 'video/webm',
  VIDEO_MP4 = 'video/mp4',
  FONT_TTF = 'font/ttf',
  FONT_WOFF = 'font/woff',
  FONT_WOFF2 = 'font/woff2',
  MULTIPART_FORM_DATA = 'multipart/form-data',
}

export const getContentType = (headers: HttpHeaders): O.Option<string> =>
  pipe(
    O.fromNullable(headers['content-type'] ?? headers['Content-Type']),
    O.chain(value => Array.isArray(value)
      ? A.head(value)
      : O.some(String(value))),
  );

export const getContentTypeUnsafe = (headers: HttpHeaders): string =>
  pipe(
    getContentType(headers),
    O.getOrElse(constant('')),
  );

export const getContentTypeEncoding = (headers: HttpHeaders): O.Option<string> =>
  pipe(
    getContentType(headers),
    O.chain(cType => O.fromNullable(/charset=([^()<>@,;:\"/[\]?.=\s]*)/i.exec(cType))),
    O.chain(res => O.fromNullable(res[1] || null)),
  );

export const isJsonContentType = (headerValue: string): boolean =>
  headerValue.includes('json');
