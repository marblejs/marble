import { BodyParser } from '../body.model';

export const jsonParser: BodyParser = _ => body =>
  JSON.parse(body.toString());
