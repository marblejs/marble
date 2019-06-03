import { AwsLambdaProxy } from '../awsLambdaProxy';

describe('@marblejs/serverless - AWS Proxy', () => {
  let proxy: AwsLambdaProxy;

  beforeEach(() => {
    proxy = new AwsLambdaProxy(() => void 0);
  });
  afterEach(() => {
    proxy.close();
  });

  test('#normalizeError() returns correct lambda response', async () => {
    const normalizedError = await Promise.resolve(proxy.normalizeError(new Error('Something bad happened.')));

    expect(normalizedError).toEqual({
      body: 'Something bad happened.',
      headers: {},
      statusCode: 502
    });
  });

  test('#normalizeRequest() returns server proxy request for minimal request data', async () => {
    const normalizedRequest = await Promise.resolve(proxy.normalizeRequest({
      event: {
        httpMethod: 'GET',
        path: '/',
      } as any,
      context: {} as any,
    }));

    expect(normalizedRequest).toEqual({
      method: 'GET',
      path: '/',
      body: undefined,
      headers: {
        'x-apigateway-context': '%7B%7D',
        'x-apigateway-event': '%7B%22httpMethod%22%3A%22GET%22%2C%22path%22%3A%22%2F%22%7D',
      },
    });
  });

  test('#normalizeRequest() creates Buffer with base64 encoding', async () => {
    const normalizedRequest = await Promise.resolve(proxy.normalizeRequest({
      event: {
        httpMethod: 'GET',
        path: '/',
        body: Buffer.from('test').toString('base64'),
        isBase64Encoded: true
      } as any,
      context: {} as any,
    }));

    expect(normalizedRequest).toEqual({
      method: 'GET',
      path: '/',
      body: Buffer.from('test'),
      headers: {
        'x-apigateway-context': '%7B%7D',
        'x-apigateway-event': '%7B%22httpMethod%22%3A%22GET%22%2C%22path%22%3A%22%2F%22%2C%22isBase64Encoded%22%3Atrue%7D',
      },
    });
  });

  test('#normalizeResponse() ', async () => {

  });
});
