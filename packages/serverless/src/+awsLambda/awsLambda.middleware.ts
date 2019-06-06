import { map } from 'rxjs/operators';
import { HttpMiddlewareEffect } from '@marblejs/core';
import { getHeaderContent } from '../serverProxy.helpers';
import { AwsLambdaHeaders } from './awsLambda.types';

export const awsApiGatewayMiddleware$ = (): HttpMiddlewareEffect => (req$) => req$.pipe(
  map(req => {
    req.apiGatewayEvent = getHeaderContent(req.headers[AwsLambdaHeaders.APIGATEWAY_EVENT]);
    req.apiGatewayContext = getHeaderContent(req.headers[AwsLambdaHeaders.AWSLAMBDA_CONTEXT]);
    return req;
  }),
);
