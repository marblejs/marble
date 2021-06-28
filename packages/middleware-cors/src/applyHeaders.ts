import { HttpResponse } from '@marblejs/http';

export interface ConfiguredHeader {
  key: AccessControlHeader;
  value: string;
}

export enum AccessControlHeader {
  Origin = 'Access-Control-Allow-Origin',
  Methods = 'Access-Control-Allow-Methods',
  Headers = 'Access-Control-Allow-Headers',
  Credentials = 'Access-Control-Allow-Credentials',
  MaxAge = 'Access-Control-Max-Age',
  ExposeHeaders = 'Access-Control-Expose-Headers',
}

export const applyHeaders = (
  headers: ConfiguredHeader[],
  res: HttpResponse,
): void => {
  headers.forEach(({ key, value }) => {
    res.setHeader(key, value);
  });
};



