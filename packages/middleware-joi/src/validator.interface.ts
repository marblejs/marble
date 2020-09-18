/* eslint-disable @typescript-eslint/no-unused-vars */
import * as Joi from 'joi';
import { Schema } from './validator.schema';

export type ExtractedBody<T extends Schema> = ExtractObject<T['body']>;
export type ExtractedParams<T extends Schema> = ExtractObject<T['params']>;
export type ExtractedQuery<T extends Schema> = ExtractObject<T['query']>;

export type ExtractObject<T> =
  T extends Joi.ObjectSchema
    ? ExtractType<T>
    : { [K in keyof T]: ExtractType<T[K]> };

export type ExtractType<T> =
  T extends Joi.NumberSchema ? number :
  T extends Joi.BooleanSchema ? boolean :
  T extends Joi.StringSchema ? string :
  T extends Joi.DateSchema ? Date :
  T extends Joi.ObjectSchema<infer U> ?
  U extends null ? Record<string, any> : { [K in keyof U]: ExtractType<U[K]> } :
  T extends Joi.ArraySchema<infer U> ?
  U extends null ? any[] : U[] :
  unknown;

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
}
