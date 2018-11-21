import 'joi';

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
    any;
}
