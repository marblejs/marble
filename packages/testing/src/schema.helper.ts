import * as GenerateSchema from 'generate-schema';
import { OpenAPIV3 } from 'openapi-types';

export const generateJsonSchema = (value: any): OpenAPIV3.SchemaObject => {
  const schema = GenerateSchema.json(value);
  delete schema.$schema;
  return schema;
};
