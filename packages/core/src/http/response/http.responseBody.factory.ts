import { Stream } from 'stream';
import { pipe } from 'fp-ts/lib/pipeable';
import { HttpHeaders } from '../http.interface';
import { ContentType, getContentType, isJsonContentType } from '../../+internal/http';
import { isStream, stringifyJson, transformUrlEncoded, bufferFrom } from '../../+internal/utils';

export type ResponseBodyFactory = (headers: HttpHeaders) => (body: any) => string | Stream | Buffer;

export const bodyFactory: ResponseBodyFactory = headers => body => {
  const contentType = getContentType(headers);

  if (isStream(body))
    return body;

  if (isJsonContentType(contentType))
    return stringifyJson(body);

  switch (contentType) {
    case ContentType.APPLICATION_X_WWW_FORM_URLENCODED:
      return transformUrlEncoded(body);
    case ContentType.APPLICATION_OCTET_STREAM:
      return !Buffer.isBuffer(body)
        ? pipe(body, stringifyJson, bufferFrom)
        : body;
    case ContentType.TEXT_PLAIN:
      return String(body);
    default:
      return body;
  }
};
