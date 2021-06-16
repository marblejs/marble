import { isString } from '@marblejs/core/src/+internal/utils';
import { HttpMethod, HttpRequest, HttpResponse, HttpStatus } from '@marblejs/core';
import { checkOrigin } from './checkOrigin';
import { AccessControlHeader, applyHeaders, ConfiguredHeader } from './applyHeaders';
import { CORSOptions } from './middleware';
import { capitalize } from './util';

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
