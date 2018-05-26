import { HttpRequest } from '@marblejs/core';

export const isAuthorized = (request: HttpRequest) =>
  request.headers.authorization
    ? request.headers.authorization === 'Bearer FAKE'
    : false;
