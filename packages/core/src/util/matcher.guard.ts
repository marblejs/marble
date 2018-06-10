import { HttpRequest } from '../http.interface';

export const isRequestNotMatched = (req: HttpRequest) =>
  !(req.matchPath && req.matchType);

export const matchGuard = (isMatched: boolean) => (req: HttpRequest) => {
  if (!isMatched && isRequestNotMatched(req)) {
    req.matchType = false;
    req.matchPath = false;
  }

  return isMatched;
};
