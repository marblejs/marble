import { of } from 'rxjs';
import { awsApiGatewayMiddleware$ } from '../awsLambda.middleware';
import { HttpRequest } from '@marblejs/core';

describe('@marblejs/serverless - AWS API Gateway Middleware', () => {
  test('extracts headers from request', async () => {
    const request = await awsApiGatewayMiddleware$()(
      of({
        headers: {
          'x-apigateway-context': ['%7B%22context%22%3A0%7D'],
          'x-apigateway-event': '%7B%22event%22%3A1%7D',
        }
      } as any as HttpRequest),
      null as any,
      null as any
    ).toPromise();
    expect(request.apiGatewayContext).toEqual({ context: 0 });
    expect(request.apiGatewayEvent).toEqual({ event: 1 });
  });
});
