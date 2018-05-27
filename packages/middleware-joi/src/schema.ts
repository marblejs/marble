import { object, ObjectSchema } from 'joi';

export const SchemaValidator: ObjectSchema = object().keys({
  headers: object(),
  params: object(),
  query: object(),
  body: object(),
}).min(1);

export interface Schema {
  headers?: any;
  params?: any;
  query?: any;
  body?: any;
}
