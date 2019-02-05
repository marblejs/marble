import { RequestBodyParser } from '../body.model';

export const textParser: RequestBodyParser = _ => body =>
  body.toString();
