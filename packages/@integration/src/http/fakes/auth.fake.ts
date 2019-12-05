import { HttpRequest } from '@marblejs/core';

export const isAuthorized = (request: HttpRequest) =>
  request.headers.authorization || request.url.includes('?token')
    ? request.headers.authorization === 'Bearer FAKE' || request.url.includes('?token=FAKE')
    : false;
