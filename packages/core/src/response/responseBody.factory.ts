import { HttpHeaders } from '../http.interface';
import { ContentType } from '../+internal';

export const bodyFactory = (headers: HttpHeaders) => (body: any) => {
  switch (headers['Content-Type']) {
    case ContentType.APPLICATION_JSON:
      return JSON.stringify(body);
    default:
      return body;
  }
};
