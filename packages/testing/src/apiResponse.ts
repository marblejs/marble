import { TestRequest, TestResponse } from './testProxy.options';
import { ApiCollection } from './apiCollection';
import { HttpHeaders, HttpMethod } from '@marblejs/core';
import { stripMetadataHeader, TestingMetadata } from '@marblejs/core/dist/+internal';
import { EndpointResponse } from './testing.types';

const formatJson = (object: any) => JSON.stringify(object, null, 2);

export class ApiResponse {
  public description = '';
  public metadata: TestingMetadata;

  constructor(
    public readonly request: TestRequest,
    public readonly response: TestResponse,
  ) {
    try {
      this.metadata = stripMetadataHeader(response.headers);
    } catch {
      this.metadata = {};
      throw new Error(
        `Failed getting internal Marble metadata from response:\n` +
        `${request.method} ${request.path} - ${response.statusCode}: ${response.statusMessage}\n` +
        `headers: ${formatJson(response.headers)}\n` +
        `body: ${formatJson(response.body)}`,
      );
    }
  }

  get method(): HttpMethod {
    return this.request.method;
  }

  get path(): string {
    return this.metadata.path || this.request.path;
  }

  get status(): number {
    return this.response.statusCode;
  }

  get headers(): HttpHeaders {
    return this.response.headers;
  }

  get body(): any {
    return this.response.body;
  }

  get failed(): boolean {
    return this.response.statusCode >= 400;
  }

  get succeeded(): boolean {
    return !this.failed;
  }

  describe(description: string): this {
    this.description = description;
    return this;
  }

  get data(): EndpointResponse {
    const { metadata, description, request, response } = this;
    return {
      metadata,
      description,
      res: response,
      req: request,
    };
  }

  collect(apiCollection: ApiCollection): this {
    apiCollection.add(this);
    return this;
  }
}
