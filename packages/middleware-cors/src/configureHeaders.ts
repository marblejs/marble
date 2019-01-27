import { HttpRequest, HttpResponse } from '@marblejs/core';

import { capitalize, isNotEmptyArray, isString } from './util';
import { CORSOptions } from './middleware';

interface ConfiguredHeader {
  key: string;
  value: string;
}

enum AccessControlAllow {
  Origin = 'Access-Control-Allow-Origin',
  Methods = 'Access-Control-Allow-Methods',
  Headers = 'Access-Control-Allow-Headers',
  Credentials = 'Access-Control-Allow-Credentials',
}

const configureAllowedOrigin = (
  req: HttpRequest,
  allowedOrigin: string | string[] | RegExp,
): ConfiguredHeader[] => {
  const headers: ConfiguredHeader[] = [];
  const origin = req.headers.origin as string;

  if (isString(allowedOrigin) && allowedOrigin === '*') {
    headers.push({ key: AccessControlAllow.Origin, value: '*' });
  } else if (
    isString(allowedOrigin) &&
    allowedOrigin !== '*' &&
    origin.match(allowedOrigin as string)
  ) {
    headers.push({ key: AccessControlAllow.Origin, value: origin });
  } else if (
    isNotEmptyArray(allowedOrigin) &&
    (allowedOrigin as Array<string>).includes(origin)
  ) {
    headers.push({ key: AccessControlAllow.Origin, value: origin });
  } else if (allowedOrigin instanceof RegExp && allowedOrigin.test(origin)) {
    headers.push({ key: AccessControlAllow.Origin, value: origin });
  }

  return headers;
};

const configureAllowedMethods = (
  req: HttpRequest,
  methods: string[],
): ConfiguredHeader[] => {
  const headers: ConfiguredHeader[] = [];

  if (isNotEmptyArray(methods) && methods.includes(req.method)) {
    headers.push({
      key: AccessControlAllow.Methods,
      value: methods.join(', '),
    });
  }

  return headers;
};

const configureAllowedHeaders = (
  allowedHeaders: string | string[],
): ConfiguredHeader[] => {
  const headers: ConfiguredHeader[] = [];

  if (isString(allowedHeaders) && allowedHeaders === '*') {
    headers.push({
      key: AccessControlAllow.Headers,
      value: '*',
    });
  } else if (isNotEmptyArray(allowedHeaders)) {
    headers.push({
      key: AccessControlAllow.Headers,
      value: (allowedHeaders as Array<string>)
        .map(header => capitalize(header))
        .join(', '),
    });
  }

  return headers;
};

const configureCredentials = (withCredentials: boolean): ConfiguredHeader[] => {
  if (withCredentials) {
    return [{ key: AccessControlAllow.Credentials, value: 'true' }];
  }

  return [];
};

const applyHeaders = (headers: ConfiguredHeader[], res: HttpResponse): void => {
  headers.forEach(({ key, value }) => {
    res.setHeader(key, value);
  });
};

export function configureHeaders(
  req: HttpRequest,
  res: HttpResponse,
  options: CORSOptions,
): void {
  // @todo add exposed headers
  const headers = [
    ...configureAllowedOrigin(req, options.origin!),
    ...configureCredentials(options.withCredentials!),
  ];

  if (req.method === 'OPTIONS') {
    // @todo add max age header, exposed headers
    const preflightHeaders = [
      ...configureAllowedMethods(req, options.methods!),
      ...configureAllowedHeaders(options.allowHeaders!),
      { key: 'Content-Length', value: '0' },
    ];

    headers.push(...preflightHeaders);

    res.statusCode = options.optionsSuccessStatus!;
  }

  applyHeaders(headers, res);
}
