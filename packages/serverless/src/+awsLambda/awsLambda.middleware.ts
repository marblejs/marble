import { map } from 'rxjs/operators';
import { HttpMiddlewareEffect } from '@marblejs/core';
import { getHeaderContent } from '../serverProxy.helpers';

export const awsApiGatewayMiddleware$ = (): HttpMiddlewareEffect => (req$) => req$.pipe(
  map(req => {
    req.apiGatewayEvent = getHeaderContent(req.headers['x-apigateway-event']);
    req.apiGatewayContext = getHeaderContent(req.headers['x-apigateway-context']);
    return req;
  }),
);
