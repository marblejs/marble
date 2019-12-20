import { HttpMethod } from '../http.interface';
import { BootstrappedRouting, RouteMatched } from './http.router.interface';

export const matchRoute = (routing: BootstrappedRouting) => (url: string, method: HttpMethod): RouteMatched | undefined => {
  for (let i = 0; i < routing.length; ++i) {
    const { regExp, methods, path } = routing[i];
    const match = url.match(regExp);

    if (!match) { continue; }

    const matchedMethod = methods[method] || methods['*'];

    if (!matchedMethod) { continue; }

    const params = {};

    if (matchedMethod.parameters) {
      for (let p = 0; p < matchedMethod.parameters.length; p++) {
        params[matchedMethod.parameters[p]] = decodeURIComponent(match[p + 1]);
      }
    }

    return {
      subject: matchedMethod.subject,
      params,
      path,
    };
  }

  return undefined;
};
