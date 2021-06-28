import { HttpHeaders, HttpStatus } from '../http.interface';
import { contentTypeFactory } from './http.responseContentType.factory';

export const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'X-Content-Type-Options': 'nosniff',
};

export const headersFactory = (data: {
  body: any;
  path: string;
  status: HttpStatus;
}) => (headers?: HttpHeaders) => ({
  ...DEFAULT_HEADERS,
  ...contentTypeFactory(data),
  ...headers,
});
