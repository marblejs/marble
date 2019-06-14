import { OpenAPIV3 } from 'openapi-types';
import { generateJsonSchema } from './schema.helper';
import { getContentType } from '@marblejs/core/dist/+internal';
import { getHeaderByKey } from '@marblejs/proxy';
import { EndpointResponse, GenerationOptions } from './testing.types';

export const generateParameters = (
  generationOptions: GenerationOptions,
  { metadata }: EndpointResponse,
): Record<string, OpenAPIV3.ParameterObject> => {
  const { params = {}, query = {} } = metadata;
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
};

export const generateRequestBody = (
  generationOptions: GenerationOptions,
  { req }: EndpointResponse,
): OpenAPIV3.RequestBodyObject | undefined => {
  const { body, headers } = req;
  const schema = generateJsonSchema(body); // TODO get type from io-ts
  delete schema['$schema'];
  return body ? {
    content: {
      [getContentType(headers) || '']: {
        schema,
        example: body,
      },
    },
  } : undefined;
};

export const generateResponse = (
  generationOptions: GenerationOptions,
  { res, description }: EndpointResponse,
): OpenAPIV3.ResponseObject => {
  const { body, headers } = res;
  return {
    description,
    headers: Object.keys(headers)
      .filter(header => !generationOptions.skippedResponseHeaders.includes(header))
      .reduce((result, key) => {
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
};
