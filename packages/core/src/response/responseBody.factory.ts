import { HttpHeaders } from '../http.interface';
import { ContentType, isStream } from '../+internal';

export const bodyFactory = (headers: HttpHeaders) => (body: any) => {
  if(isStream(body)){
    return body;
  }
  switch (headers['Content-Type']) {
    case ContentType.APPLICATION_JSON:
      return JSON.stringify(body);
    default:
      return body;
  }
};
