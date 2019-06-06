import { of } from 'rxjs';
import { awsApiGatewayMiddleware$ } from '../awsLambda.middleware';
import { AwsLambdaHeaders } from '../awsLambda.types';
import { createHttpRequest } from '@marblejs/core/dist/+internal/testing/http.helper';

describe('@marblejs/serverless - AWS API Gateway Middleware', () => {
  test('extracts headers from request', async () => {
    const request = await awsApiGatewayMiddleware$()(
      of(createHttpRequest({
        headers: {
          [AwsLambdaHeaders.AWSLAMBDA_CONTEXT]: ['%7B%22context%22%3A0%7D'],
          [AwsLambdaHeaders.APIGATEWAY_EVENT]: '%7B%22event%22%3A1%7D',
        }
      })),
      null as any,
      null as any
    ).toPromise();
    expect(request.apiGatewayContext).toEqual({ context: 0 });
    expect(request.apiGatewayEvent).toEqual({ event: 1 });
  });
});
