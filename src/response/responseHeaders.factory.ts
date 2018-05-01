import { HttpHeaders } from '../http.interface';
import { ContentType } from '../util';

export const DEFAULT_HEADERS = {
  'Content-Type': ContentType.APPLICATION_JSON,
};

export const headersFactory = (headers?: HttpHeaders) => ({
  ...DEFAULT_HEADERS,
  ...headers,
});
