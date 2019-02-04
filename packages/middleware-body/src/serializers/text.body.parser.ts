import { BodyParser } from '../body.model';

export const textParser: BodyParser = _ => body =>
  body.toString();
