import { HttpHeaders, HttpRequestMetadata, HttpStatus } from '@marblejs/http';
import { HttpTestBedRequest } from './http.testBed.request.interface';

export interface HttpTestBedResponseProps {
  statusCode?: number;
  statusMessage?: string;
  headers: HttpHeaders;
  body?: Buffer;
}

export interface HttpTestBedResponse extends HttpTestBedResponseProps {
  req: HttpTestBedRequest<any>;
  metadata: HttpRequestMetadata;
  statusCode: HttpStatus;
  body?: any;
}
