import { ApiCollection } from './apiCollection';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';

export class ApiDocument {
  public readonly collections: ApiCollection[] = [];
  private description = '';
  private servers: OpenAPIV3.ServerObject[] = [];

  constructor(
    public readonly name: string,
    public readonly version: string,
  ) {
  }

  useServers(servers: OpenAPIV3.ServerObject[]): this {
    this.servers = servers;
    return this;
  }

  describe(description: string): this {
    this.description = description;
    return this;
  }

  add(collection: ApiCollection): this {
    this.collections.push(collection);
    return this;
  };

  generate(): OpenAPI.Document {
    return {
      openapi: "3.0.2",
      info: {
        title: this.name,
        version: this.version,
        description: this.description,
      },
      servers: this.servers,
      tags: this.collections.map(collection => collection.generateTag()),
      paths: this.collections.reduce(
        (endpoints, collection) => Object.assign(endpoints, collection.generateEndpoints()),
        {},
      ),
    };
  }
}
