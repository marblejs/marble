import { map } from 'rxjs/operators';
import { HttpMiddlewareEffect } from '@marblejs/core';
import { AwsLambdaHeaders } from './awsLambda.types';

const getHeaderContent = (header: undefined | string | string[]) =>
  header && JSON.parse(decodeURIComponent(typeof header === 'string' ? header : header[0]));

export const awsApiGatewayMiddleware$ = (): HttpMiddlewareEffect => (req$) => req$.pipe(
  map(req => {
    req.apiGatewayEvent = getHeaderContent(req.headers[AwsLambdaHeaders.APIGATEWAY_EVENT]);
    req.apiGatewayContext = getHeaderContent(req.headers[AwsLambdaHeaders.AWSLAMBDA_CONTEXT]);
    return req;
  }),
);
