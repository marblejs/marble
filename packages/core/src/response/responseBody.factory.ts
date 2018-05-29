import { HttpHeaders } from '../http.interface';
import { ContentType } from '../util/contentType.util';

export const bodyFactory = (headers: HttpHeaders) => (body: any) => {
  switch (headers['Content-Type']) {
    case ContentType.APPLICATION_JSON:
      return JSON.stringify(body);
    default:
      return body;
  }
};
