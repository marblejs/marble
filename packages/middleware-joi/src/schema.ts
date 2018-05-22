const Joi = require('joi');

export const SchemaValidator = Joi.object().keys({
  headers: Joi.object(),
  params: Joi.object(),
  query: Joi.object(),
  body: Joi.object(),
}).min(1);

export interface Schema {
  headers?: any;
  params?: any;
  query?: any;
  body?: any;
}
