import { Reader } from 'fp-ts/lib/Reader';
import { Context } from '@marblejs/core';
import { HttpHeaders, HttpListener, HttpMethod } from '@marblejs/http';
import { TestBed, TestBedType } from '../testBed.interface';
import { HttpTestBedRequest, HttpTestBedRequestBuilder } from './http.testBed.request.interface';
import { HttpTestBedResponse } from './http.testBed.response.interface';

export interface HttpTestBedConfig {
  listener: Reader<Context, HttpListener>;
  defaultHeaders?: HttpHeaders;
}

export interface HttpTestBed extends TestBed {
  type: TestBedType.HTTP;
  send: <T extends HttpMethod>(req: HttpTestBedRequest<T>) => Promise<HttpTestBedResponse>;
  request: HttpTestBedRequestBuilder;
}
