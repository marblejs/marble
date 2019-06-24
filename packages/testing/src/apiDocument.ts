import { ApiCollection } from './apiCollection';
import { OpenAPI, OpenAPIV3 } from 'openapi-types';
import { join } from './apiDocument.helper';
import { DocumentData, GenerationOptions, OneOrMore } from './testing.types';

export class ApiDocument {
  public static deserialize(...data: OneOrMore<DocumentData>) {
    const primary = data[0];
    const document = new ApiDocument(primary.name, primary.version)
      .useServers(primary.servers)
      .useSecurityScheme(primary.securityScheme)
      .describe(primary.description);

    document.generationOptions = primary.generationOptions;
    document.collections = join(
      data.map(d => d.collections),
      (d1, d2) => d1.name === d2.name,
      ApiCollection.deserialize,
    );
    return document;
  }

  private collections: ApiCollection[] = [];
  private description = '';
  private generationOptions: GenerationOptions = {
    skippedRequestHeaders: [],
    skippedResponseHeaders: [],
  };
  private servers: OpenAPIV3.ServerObject[] = [];
  private securityScheme?: OpenAPIV3.SecuritySchemeObject;

  constructor(
    public readonly name: string,
    public readonly version: string,
  ) {
  }

  useServers(servers: OpenAPIV3.ServerObject[]): this {
    this.servers = servers;
    return this;
  }

  useSecurityScheme(securityScheme?: OpenAPIV3.SecuritySchemeObject): this {
    this.securityScheme = securityScheme;
    return this;
  }

  skipRequestHeaders(headers: string[]): this {
    this.generationOptions.skippedRequestHeaders = headers;
    return this;
  }

  skipResponseHeaders(headers: string[]): this {
    this.generationOptions.skippedResponseHeaders = headers;
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
    const document: OpenAPI.Document = {
      openapi: '3.0.2',
      info: {
        title: this.name,
        version: this.version,
        description: this.description,
      },
      servers: this.servers,
      tags: this.collections.map(collection => collection.generateTag()),
      paths: this.collections.reduce(
        (endpoints, collection) => Object.assign(endpoints, collection.generateEndpoints(this.generationOptions)),
        {},
      ),
      components: {},
    };

    if (this.securityScheme && document.components) {
      document.components.securitySchemes = {
        globalSecurityScheme: this.securityScheme,
      };
      document.security = [{ globalSecurityScheme: [] }];
    }
    return document;
  }

  serialize(): DocumentData {
    return {
      name: this.name,
      version: this.version,
      description: this.description,
      servers: this.servers,
      securityScheme: this.securityScheme,
      generationOptions: this.generationOptions,
      collections: this.collections.map(collection => collection.serialize()),
    };
  }
}
