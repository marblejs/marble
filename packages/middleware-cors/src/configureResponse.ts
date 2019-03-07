import { HttpRequest, HttpResponse } from '@marblejs/core';

import { AccessControlHeader, applyHeaders, ConfiguredHeader } from './applyHeaders';
import { CORSOptions } from './middleware';
import { capitalize } from './util';

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
