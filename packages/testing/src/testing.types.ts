import { HttpMethod } from '@marblejs/core';
import { TestRequest, TestResponse } from './testProxy.options';
import { OpenAPIV3 } from 'openapi-types';
import { TestingMetadata } from '@marblejs/core/dist/+internal/testing';

export type OneOrMore<T> = [T, ...T[]];

export interface GenerationOptions {
  skippedRequestHeaders: string[];
  skippedResponseHeaders: string[];
}

export interface EndpointResponse {
  metadata: TestingMetadata;
  description: string;
  req: TestRequest;
  res: TestResponse;
}

export interface EndpointData {
  method: HttpMethod;
  path: string;
  responses: EndpointResponse[];
}

export interface CollectionData {
  name: string;
  description: string;
  endpoints: EndpointData[];
}

export interface DocumentData {
  name: string;
  version: string;
  servers: OpenAPIV3.ServerObject[];
  securityScheme?: OpenAPIV3.SecuritySchemeObject;
  description: string;
  collections: CollectionData[];
}
