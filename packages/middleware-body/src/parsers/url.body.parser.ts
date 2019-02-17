import * as qs from 'qs';
import { RequestBodyParser } from '../body.model';

export const urlEncodedParser: RequestBodyParser = _ => body =>
  qs.parse(body.toString());
