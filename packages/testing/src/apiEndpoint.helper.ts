import { OpenAPIV3 } from 'openapi-types';
import { getContentType } from '@marblejs/core/dist/+internal';
import { getHeaderByKey } from '@marblejs/proxy';
import { EndpointResponse, GenerationOptions } from './testing.types';

export const generateParameters = (
  generationOptions: GenerationOptions,
  { metadata }: EndpointResponse,
): Record<string, OpenAPIV3.ParameterObject> => {
  const {
    params = {},
    query = {},
    headers = {},
  } = metadata;
  return [
    ...Object.entries(params.properties || {}).map(([key, schema]) => ({
      name: key,
      in: 'path',
      required: true,
      schema,
    })),
    ...Object.entries(query.properties || {}).map(([key, schema]) => ({
      name: key,
      in: 'query',
      required: (query.required || []).includes(key),
      schema,
    })),
    ...Object.entries(headers.properties || {}).map(([key, schema]) => ({
      name: key,
      in: 'headers',
      required: (headers.required || []).includes(key),
      schema,
    })),
  ].reduce((result, entry) => {
    result[entry.in + '-' + entry.name] = entry;
    return result;
  }, {});
};

export const generateRequestBody = (
  generationOptions: GenerationOptions,
  { req, metadata }: EndpointResponse,
): OpenAPIV3.RequestBodyObject | undefined => {
  const { body: schema } = metadata as any;
  const { body: example, headers } = req;
  return example ? {
    content: {
      [getContentType(headers) || '']: {
        schema,
        example,
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
      .filter(header => {
        debugger;
        return !generationOptions.skippedResponseHeaders
          .find(h => h.toLowerCase() === header.toLowerCase())
      })
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
