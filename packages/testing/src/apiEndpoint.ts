import { OpenAPIV3 } from 'openapi-types';
import { ApiResponse } from './apiResponse';
import { generateParameters, generateRequestBody, generateResponse } from './apiEndpoint.helper';
import { EndpointData, GenerationOptions, OneOrMore } from './testing.types';

export interface EndpointGenerationOptions {
  tags: string[];
}

export class ApiEndpoint {
  static deserialize(...data: OneOrMore<EndpointData>) {
    const endpoint = new ApiEndpoint(data[0]);
    for (const { responses } of data.slice(1)) {
      endpoint.data.responses.push(...responses);
    }
    return endpoint;
  }

  constructor(
    public readonly data: EndpointData
  ) {
  }

  matches(apiResponse: ApiResponse) {
    const { method, path } = this.data;
    return apiResponse.method === method && apiResponse.path === path;
  }

  add(apiResponse: ApiResponse) {
    this.data.responses.push(apiResponse.data);
    return this;
  }

  generate(generationOptions: GenerationOptions, { tags }: EndpointGenerationOptions): OpenAPIV3.PathItemObject {
    const { method, responses } = this.data;
    const pathItemObject: OpenAPIV3.PathItemObject = {};
    pathItemObject[method.toLowerCase()] = {
      tags,
      parameters: Object.values(responses.reduce((result, response) =>
        Object.assign(result, generateParameters(generationOptions, response)), {})),
      requestBody: responses
        .map(response => generateRequestBody(generationOptions, response))
        .filter(Boolean)[0],
      responses: responses.reduce((responses, response) => {
        responses[response.res.statusCode] = generateResponse(generationOptions, response);
        return responses;
      }, {}),
    } as OpenAPIV3.OperationObject;
    return pathItemObject;
  }

  serialize(): any {
    return this.data;
  }
}
