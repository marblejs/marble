import { HttpRequest } from '../../http/http.interface';

export const getHeaderValue = <T extends string = string>(key: string) => (req: HttpRequest): T | undefined => {
  const header = req.headers[key.toLowerCase()];
  return Array.isArray(header)
    ? header[0] as T
    : header as T;
};
