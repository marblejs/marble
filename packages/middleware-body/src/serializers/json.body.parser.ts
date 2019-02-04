import { RequestBodyParser } from '../body.model';

export const jsonParser: RequestBodyParser = _ => body =>
  JSON.parse(body.toString());
