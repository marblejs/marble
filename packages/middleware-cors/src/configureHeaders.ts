import { HttpRequest, HttpResponse, HttpMethod, HttpStatus } from '@marblejs/core';

import { checkOrigin } from './checkOrigin';
import { CORSOptions } from './middleware';
import { capitalize, isString } from './util';

interface ConfiguredHeader {
  key: string;
  value: string;
}

enum AccessControlHeader {
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

export function configurePreflightResponse(
  req: HttpRequest,
  res: HttpResponse,
  options: CORSOptions,
): void {
  const origin = req.headers.origin as string;
  const headers: ConfiguredHeader[] = [];

  res.statusCode = options.optionsSuccessStatus as HttpStatus;

  if (!checkOrigin(req, options.origin as string)) {
    return;
  }

  headers.push({ key: AccessControlHeader.Origin, value: origin });

  if (options.withCredentials) {
    headers.push({ key: AccessControlHeader.Credentials, value: 'true' });
  }

  if (isString(options.allowHeaders) && options.allowHeaders === '*') {
    headers.push({
      key: AccessControlHeader.Headers,
      value: '*',
    });
  } else if (
    Array.isArray(options.allowHeaders) &&
    options.allowHeaders.length > 0
  ) {
    headers.push({
      key: AccessControlHeader.Headers,
      value: options.allowHeaders.map(header => capitalize(header)).join(', '),
    });
  }

  if (options.maxAge) {
    headers.push({
      key: AccessControlHeader.MaxAge,
      value: `${options.maxAge}`,
    });
  }

  if (Array.isArray(options.methods) && options.methods.length > 0) {
    if (
      req.headers['access-control-request-method'] &&
      !options.methods.includes((req.headers[
        'access-control-request-method'
      ] as unknown) as HttpMethod)
    ) {
      res.statusCode = 405;
    } else {
      headers.push({
        key: AccessControlHeader.Methods,
        value: options.methods.join(', '),
      });
    }
  }

  applyHeaders(headers, res);
}

export function configureResponse(
  req: HttpRequest,
  res: HttpResponse,
  options: CORSOptions,
): void {
  const headers: ConfiguredHeader[] = [];
  const origin = req.headers.origin as string;

  headers.push({ key: AccessControlHeader.Origin, value: origin });

  if (options.withCredentials) {
    headers.push({ key: AccessControlHeader.Credentials, value: 'true' });
  }

  if (
    Array.isArray(options.exposeHeaders) &&
    options.exposeHeaders.length > 0
  ) {
    headers.push({
      key: AccessControlHeader.ExposeHeaders,
      value: options.exposeHeaders.map(header => capitalize(header)).join(', '),
    });
  }

  applyHeaders(headers, res);
}
