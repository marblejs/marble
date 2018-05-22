const Joi = require('joi');

export const SchemaValidator = Joi.object().keys({
  headers: Joi.any(),
  params: Joi.any(),
  query: Joi.any(),
  body: Joi.any(),
}).min(1);

export interface Schema {
  headers?: any;
  params?: any;
  query?: any;
  body?: any;
}
