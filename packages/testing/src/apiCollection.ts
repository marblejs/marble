import { HttpMethod } from '@marblejs/core';
import { ApiResponse } from './apiResponse';
import { OpenAPIV3 } from 'openapi-types';

export interface Endpoint {
  method: HttpMethod;
  path: string;
  responses: ApiResponse[];
}

export class ApiCollection {
  public readonly endpoints: Endpoint[] = [];
  public description = '';

  constructor(public readonly name: string) {
  }

  describe(description: string) {
    this.description = description;
    return this;
  }

  findEndpoint(method: HttpMethod, path: string): Endpoint | undefined {
    return this.endpoints.find(endpoint => endpoint.method === method && endpoint.path === path);
  }

  add(response: ApiResponse) {
    const { method, path } = response;
    const endpoint = this.findEndpoint(method, path);
    if (endpoint) {
      endpoint.responses.push(response);
      return;
    }
    this.endpoints.push({
      method,
      path,
      responses: [response],
    });
    return this;
  }

  generateTag(): OpenAPIV3.TagObject {
    return {
      name: this.name,
      description: this.description,
    };
  }

  generateEndpoints(): OpenAPIV3.PathObject {
    return this.endpoints.reduce((paths, endpoint) => {
      const path: OpenAPIV3.PathItemObject = paths[endpoint.path] || (paths[endpoint.path] = {});
      path[endpoint.method.toLowerCase()] = {
        tags: [this.name],
        parameters: Object.values(endpoint.responses.reduce((result, response) =>
          Object.assign(result, response.generateParameters()), {})),
        requestBody: endpoint.responses
          .map(response => response.generateRequestBody())
          .filter(Boolean)[0],
        responses: endpoint.responses.reduce((responses, response) => {
          responses[response.status] = response.generateResponse();
          return responses;
        }, {}),
      } as OpenAPIV3.OperationObject;
      return paths;
    }, {});
  }
}
