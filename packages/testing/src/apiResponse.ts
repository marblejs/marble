import { TestRequest, TestResponse } from './testProxy.options';
import { ApiCollection } from './apiCollection';
import { HttpHeaders, HttpMethod } from '@marblejs/core';
import { OpenAPIV3 } from 'openapi-types';
import { getHeaderByKey } from '@marblejs/proxy';
import { stripMetadataHeader, TestingMetadata } from '@marblejs/core/dist/+internal';
import { generateJsonSchema } from './schema.helper';

export class ApiResponse {
  public description = '';
  public metadata: TestingMetadata;

  constructor(
    public readonly request: TestRequest,
    public readonly response: TestResponse,
  ) {
    this.metadata = stripMetadataHeader(response.headers);
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

  get responseHeaders(): HttpHeaders {
    return this.response.headers;
  }

  get responseBody(): any {
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

  collect(apiCollection: ApiCollection): this {
    apiCollection.add(this);
    return this;
  }

  generateParameters(): Record<string, OpenAPIV3.ParameterObject> {
    const { params = {}, query = {} } = this.metadata;
    return [
      ...Object.entries(params).map(([key, value]) => ({
        name: key,
        in: 'path',
        example: value,
        required: true,
        schema: { type: 'string' }, // TODO get type from io-ts
      })),
      ...Object.entries(query).map(([key, value]) => ({
        name: key,
        in: 'query',
        example: value,
        required: false,
        schema: { type: 'string' }, // TODO get type from io-ts
      })),
    ].reduce((result, entry) => {
      result[entry.in + '-' + entry.name] = entry;
      return result;
    }, {});
  }

  generateRequestBody(): OpenAPIV3.RequestBodyObject | undefined {
    const { body, headers } = this.request;
    const schema = generateJsonSchema(body); // TODO get type from io-ts
    delete schema['$schema'];
    return body ? {
      content: {
        [getHeaderByKey(headers, 'content-type') || '']: {
          schema,
          example: body,
        },
      },
    } : undefined;
  }

  generateResponse(): OpenAPIV3.ResponseObject {
    const { body, headers } = this.response;
    return {
      description: this.description,
      headers: Object.keys(headers).reduce((result, key) => {
        const value = getHeaderByKey(headers, key);
        result[key] = {
          schema: {
            description: value,
            type: typeof value,
          },
        };
        return result;
      }, {}),
      content: {
        [getHeaderByKey(headers, 'content-type') || '']: {
          example: body,
        },
      }
    };
  }
}
