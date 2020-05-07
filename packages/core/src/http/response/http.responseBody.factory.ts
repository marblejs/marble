import * as qs from 'qs';
import { HttpHeaders } from '../http.interface';
import { ContentType, getContentType } from '../../+internal/http';
import { isStream, isString } from '../../+internal/utils';

export type ResponseBodyFactory = (headers: HttpHeaders) => (body: any) => any;
export type BodyTransformer = (body: any) => string;

const transformUrlEncoded: BodyTransformer = body =>
  !isString(body) ? qs.stringify(body) : body;

const transformJson: BodyTransformer = body =>
  JSON.stringify(body);

export const bodyFactory: ResponseBodyFactory = headers => body => {
  if (isStream(body)) return body;

  switch (getContentType(headers)) {
    case ContentType.APPLICATION_X_WWW_FORM_URLENCODED:
      return transformUrlEncoded(body);
    case ContentType.APPLICATION_JSON:
      return transformJson(body);
    case ContentType.TEXT_PLAIN:
      return String(body);
    default:
      return body;
  }
};
