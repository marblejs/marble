import { HttpHeaders } from '../http.interface';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
};

export const headersFactory = (headers?: HttpHeaders) => ({
  ...DEFAULT_HEADERS,
  ...headers,
});
