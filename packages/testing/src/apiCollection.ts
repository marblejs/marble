import { ApiResponse } from './apiResponse';
import { OpenAPIV3 } from 'openapi-types';
import { ApiEndpoint } from './apiEndpoint';
import { join } from './apiDocument.helper';
import { CollectionData, GenerationOptions, OneOrMore } from './testing.types';

export class ApiCollection {
  public static deserialize(...data: OneOrMore<CollectionData>) {
    const collection = new ApiCollection(data[0].name)
      .describe(data[0].description);
    collection.endpoints = join(
      data.map(d => d.endpoints),
      (e1, e2) => e1.method === e2.method && e1.path === e2.path,
      ApiEndpoint.deserialize,
    );
    return collection;
  }

  public endpoints: ApiEndpoint[] = [];
  public description = '';

  constructor(public readonly name: string) {
  }

  describe(description: string) {
    this.description = description;
    return this;
  }

  findEndpoint(apiResponse: ApiResponse): ApiEndpoint | undefined {
    return this.endpoints.find(endpoint => endpoint.matches(apiResponse));
  }

  add(response: ApiResponse) {
    const { method, path } = response;
    const endpoint = this.findEndpoint(response);
    if (endpoint) {
      endpoint.add(response);
      return this;
    }
    this.endpoints.push(
      new ApiEndpoint({
        method,
        path,
        responses: [],
      }).add(response)
    );
    return this;
  }

  generateTag(): OpenAPIV3.TagObject {
    return {
      name: this.name,
      description: this.description,
    };
  }

  generateEndpoints(generationOptions: GenerationOptions): OpenAPIV3.PathObject {
    return this.endpoints.reduce((paths, endpoint) => {
      const path: OpenAPIV3.PathItemObject = paths[endpoint.data.path] || (paths[endpoint.data.path] = {});
      Object.assign(path, endpoint.generate(generationOptions, {
        tags: [this.name],
      }));
      return paths;
    }, {});
  }

  serialize(): CollectionData {
    return {
      name: this.name,
      description: this.description,
      endpoints: this.endpoints.map(e => e.serialize()),
    };
  }
}
