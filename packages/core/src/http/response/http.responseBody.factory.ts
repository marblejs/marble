import { HttpHeaders } from '../http.interface';
import { ContentType, getContentType } from '../../+internal/http';
import { isStream } from '../../+internal/utils';

export type ResponseBodyFactory = (headers: HttpHeaders) => (body: any) => any;

export const bodyFactory: ResponseBodyFactory = headers => body => {
  if (isStream(body)) {
    return body;
  }

  switch (getContentType(headers)) {
    case ContentType.APPLICATION_JSON:
      return JSON.stringify(body);
    case ContentType.TEXT_PLAIN:
      return String(body);
    default:
      return body;
  }
};
