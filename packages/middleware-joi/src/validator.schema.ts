import * as Joi from 'joi';

export const SchemaValidator = Joi.object().keys({
  headers: Joi.object(),
  params: Joi.object(),
  query: Joi.object(),
  body: Joi.object(),
}).min(1);

export interface Schema<TBody = any, TParams = any, TQuery = any, THeaders = any> {
  body: TBody;
  params: TParams;
  query: TQuery;
  headers: THeaders;
}
