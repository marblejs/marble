import { AwsLambdaProxy } from '../awsLambdaProxy';
import { AwsLambdaHeaders } from '../awsLambda.types';

describe('@marblejs/serverless - AWS Proxy', () => {
  let proxy: AwsLambdaProxy;

  beforeEach(() => {
    proxy = new AwsLambdaProxy(() => void 0, {
      logger: () => void 0,
    });
  });

  afterEach(() => {
    proxy.close();
  });

  test('#normalizeError() returns correct lambda response', () => {
    const normalizedError = proxy.normalizeError(new Error('Something bad happened.'));

    expect(normalizedError).toEqual({
      body: 'Something bad happened.',
      headers: {},
      statusCode: 502
    });
  });

  test('#normalizeRequest() returns server proxy request for minimal request data', () => {
    const normalizedRequest = proxy.normalizeRequest({
      event: {
        httpMethod: 'GET',
        path: '/',
      } as any,
      context: {} as any,
    });

    expect(normalizedRequest).toEqual({
      method: 'GET',
      path: '/',
      body: undefined,
      headers: {
        [AwsLambdaHeaders.AWSLAMBDA_CONTEXT]: '%7B%7D',
        [AwsLambdaHeaders.APIGATEWAY_EVENT]: '%7B%22httpMethod%22%3A%22GET%22%2C%22path%22%3A%22%2F%22%7D',
      },
    });
  });

  test('#normalizeRequest() creates Buffer with base64 encoding', () => {
    const normalizedRequest = proxy.normalizeRequest({
      event: {
        httpMethod: 'GET',
        path: '/',
        body: Buffer.from('test').toString('base64'),
        isBase64Encoded: true
      } as any,
      context: {} as any,
    });

    expect(normalizedRequest).toEqual({
      method: 'GET',
      path: '/',
      body: Buffer.from('test'),
      headers: {
        [AwsLambdaHeaders.AWSLAMBDA_CONTEXT]: '%7B%7D',
        [AwsLambdaHeaders.APIGATEWAY_EVENT]: '%7B%22httpMethod%22%3A%22GET%22%2C%22path%22%3A%22%2F%22%2C%22isBase64Encoded%22%3Atrue%7D',
      },
    });
  });

  describe('#normalizeResponse()', () => {
    test('returns a correct response when input is correct', () => {
      const body = JSON.stringify({ test: 'json body' });
      const normalizedResponse = proxy.normalizeResponse({
        statusMessage: 'OK',
        statusCode: 200,
        body: Buffer.from(body),
        headers: {
          'Content-Type': ['application/json'],
          'Content-Length': ['20'],
        },
      });
      expect(normalizedResponse).toEqual({
        multiValueHeaders: {
          'Content-Type': ['application/json'],
          'Content-Length': ['20'],
        },
        statusCode: 200,
        body,
        isBase64Encoded: false,
      });
    });

    test('adds Content-Length header if it\'s missing', () => {
      const body = JSON.stringify({ test: 'json body' });
      const normalizedResponse = proxy.normalizeResponse({
        statusMessage: 'OK',
        statusCode: 200,
        body: Buffer.from(body),
        headers: {
          'Content-Type': ['application/json'],
        },
      });
      expect(normalizedResponse).toEqual({
        multiValueHeaders: {
          'Content-Type': ['application/json'],
          'Content-Length': ['20'],
        },
        statusCode: 200,
        body,
        isBase64Encoded: false,
      });
    });
    test('passes through an empty response', () => {
      const normalizedResponse = proxy.normalizeResponse({
        statusMessage: 'OK',
        statusCode: 200,
        headers: {},
      });
      expect(normalizedResponse).toEqual({
        multiValueHeaders: {},
        statusCode: 200,
        body: '',
        isBase64Encoded: false,
      });
    });
    test('encodes base64 body', () => {
      const body = 'dGhpcyBpcyBhIHRlc3QgYm9keQo='; // "this is a test body"
      const normalizedResponse = proxy.normalizeResponse({
        statusMessage: 'OK',
        statusCode: 200,
        body: Buffer.from(body, 'base64'),
        headers: {
          'Content-Type': ['application/octet-stream'],
        },
      });
      expect(normalizedResponse).toEqual({
        multiValueHeaders: {
          'Content-Type': ['application/octet-stream'],
          'Content-Length': ['20'],
        },
        statusCode: 200,
        body,
        isBase64Encoded: true,
      });
    });
  });
});
