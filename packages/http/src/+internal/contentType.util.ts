import * as fileType from 'file-type';
import * as mime from 'mime';
import * as O from 'fp-ts/lib/Option';
import { constant, pipe } from 'fp-ts/lib/function';
import { isString } from '@marblejs/core/dist/+internal/utils';
import { HttpHeaders } from '../http.interface';
import { getHeaderValue } from './header.util';

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

/**
 * Get `Content-Type` header value from provided headers object
 *
 * @see getHeaderValue
 * @since 4.0.0
 */
export const getContentType = getHeaderValue('Content-Type');

/**
 * Get `Content-Length` header value from provided headers object
 *
 * @see getHeaderValue
 * @since 4.0.0
 */
export const getContentLength = getHeaderValue('Content-Length');

/**
 * Get **UNSAFE** `Content-Type` header value from provided headers object
 *
 * @see getHeaderValue
 * @since 4.0.0
 */
export const getContentTypeUnsafe = (headers: HttpHeaders): string =>
  pipe(
    getContentType(headers),
    O.getOrElse(constant('')),
  );


/**
 * Get `Content-Type` charset (encoding) value, either from provided headers object or header value directly
 *
 * @since 4.0.0
 */
export const getContentTypeEncoding = (headersOrContentType: HttpHeaders | string): O.Option<string> =>
  pipe(
    isString(headersOrContentType) ? O.some(headersOrContentType) : getContentType(headersOrContentType),
    O.chain(cType => O.fromNullable(/charset=([^()<>@,;:\"/[\]?.=\s]*)/i.exec(cType))),
    O.chain(res => O.fromNullable(res[1] || null)),
    O.map(encoding => encoding.toLowerCase()),
  );

/**
 * Guess mime type for given combination of request body and path
 *
 * @param body request body
 * @param path request url
 * @returns `string | null`
 * @since 1.0.0
 */
export const getMimeType = (body: any, path: string): string | null =>
  pipe(
    O.fromNullable(Buffer.isBuffer(body) ? fileType(body) : null),
    O.map(mimeFromBuffer => mimeFromBuffer.mime),
    O.getOrElse(() => mime.getType(path)),
  );

/**
 * Checks whether given Content-Type header value is of `json` type
 *
 * @param headerValue
 * @returns boolean
 * @since 1.0.0
 */
export const isJsonContentType = (headerValue: string): boolean =>
  headerValue.includes('json');
