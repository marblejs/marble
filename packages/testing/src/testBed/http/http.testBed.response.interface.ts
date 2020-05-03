import { HttpHeaders, HttpStatus } from '@marblejs/core';
import { TestingMetadata } from '@marblejs/core/dist/+internal/testing';
import { HttpTestBedRequest } from './http.testBed.request.interface';

export interface HttpTestBedResponseProps {
  statusCode?: number;
  statusMessage?: string;
  headers: HttpHeaders;
  body?: Buffer;
}

export interface HttpTestBedResponse extends HttpTestBedResponseProps {
  req: HttpTestBedRequest<any>;
  metadata: TestingMetadata;  // @TODO: move interface to "testbed" folder
  statusCode: HttpStatus;
  body?: any;
}
