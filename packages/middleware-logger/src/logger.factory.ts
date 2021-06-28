import { Timestamp } from 'rxjs';
import { HttpRequest } from '@marblejs/http';
import { factorizeTime } from './logger.util';

export const factorizeLog = (stamp: Timestamp<HttpRequest>) => (req: HttpRequest) => {
  const { method, url } = stamp.value;
  const statusCode = String(req.response.statusCode);
  const time = factorizeTime(stamp.timestamp);

  return `${method} ${url} ${statusCode} ${time}`;
};
