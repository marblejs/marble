import * as Joi from 'joi';
import { Schema } from './validator.schema';

export type ExtractedSchema<SchemaToExtract extends Schema> = {
  [K1 in keyof SchemaToExtract]:
    SchemaToExtract[K1] extends undefined
      ? unknown
      : { [K2 in keyof SchemaToExtract[K1]]: Joi.ExtractType<SchemaToExtract[K1][K2]> }
};

export type ExtractedBody<T extends Schema> = ExtractedSchema<T>['body'];
export type ExtractedParams<T extends Schema> = ExtractedSchema<T>['params'];
export type ExtractedQuery<T extends Schema> = ExtractedSchema<T>['query'];

declare module 'joi' {
  // Object Schema
  export function object<T>(schema: T): ObjectSchema<T>;
  export interface ObjectSchema<T = null> {
    keys<T>(schema: T): ObjectSchema<ExtractType<T>>;
  }

  // ArraySchema
  export function array<T>(schema: T): ArraySchema<ExtractType<T>>;
  export interface ArraySchema<T = null> {
    items<T>(schema: T): ArraySchema<ExtractType<T>>;
  }

  // ExtractType
  export type ExtractType<T> =
    T extends NumberSchema ? number :
    T extends BooleanSchema ? boolean :
    T extends StringSchema ? string :
    T extends DateSchema ? Date :
    T extends ObjectSchema<infer U> ?
      U extends null ? Record<string, any> : { [K in keyof U]: ExtractType<U[K]> } :
    T extends ArraySchema<infer U> ?
      U extends null ? any[] : U[] :
    unknown;
}
