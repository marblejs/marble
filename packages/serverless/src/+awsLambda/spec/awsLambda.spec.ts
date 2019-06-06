import { httpListener } from '@marblejs/core';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createHandler } from './awsLambda.spec-setup';
import { createLambda } from '../../handler';
import { getHeaderByKey } from '@marblejs/proxy';

describe('@marblejs/serverless - AWS Proxy integration', () => {
  let handler;
  beforeAll(() => {
    handler = createHandler();
  });

  afterAll(() => {
    handler.close();
  });

  test('POST / returns 200', async () => {
    const event: APIGatewayProxyEvent = await import('./awsLambda.postEvent.mock.json') as any;
    const context: Context = await import('./awsLambda.postContext.mock.json') as any;
    const response: APIGatewayProxyResult = await handler(event, context);
    expect(JSON.parse(response.body)).toMatchSnapshot();
    expect(response.statusCode).toBe(200);
  });

  test('can be called multiple times asynchronously', async () => {
    const event: APIGatewayProxyEvent = await import('./awsLambda.postEvent.mock.json') as any;
    const context: Context = await import('./awsLambda.postContext.mock.json') as any;
    const eventRequest = async () => {
      const response = await handler(event, context);
      expect(response.statusCode).toBe(200);
    };
    await Promise.all(new Array(10).fill(null).map(eventRequest));
  });

  test('creates proxy wrapper only for AWS', () => {
    expect(() => createLambda({
      type: 'unknown' as any,
      httpListener: httpListener({ effects: [] }),
    })).toThrowError('Invalid type specified.');
  });

  test('removes "transfer-encoding: chunked" header', async () => {
    const response: APIGatewayProxyResult = await handler({
      httpMethod: 'GET',
      path: '/chunked-transfer',
    }, {});

    expect(response.statusCode).toBe(200);
    expect(response.multiValueHeaders).toBeDefined();
    expect(getHeaderByKey(response.multiValueHeaders, 'Content-Type')).toBe('application/json');
    expect(getHeaderByKey(response.multiValueHeaders, 'Content-Length')).toBe('15');
    expect(JSON.parse(response.body)).toEqual({ key: 'value' });
  });
});
