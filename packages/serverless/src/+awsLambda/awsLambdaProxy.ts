import * as url from 'url';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { HttpStatus } from '@marblejs/core';
import { ServerApp, ServerProxy, ServerProxyRequest, ServerProxyResponse } from '../serverProxy';
import { defaultAwsLambdaProxyOptions } from './awsLambdaProxy.options';
import { AwsLambdaProxyOptions } from './awsLambda.types';

interface ApiGatewayRequest {
  event: APIGatewayProxyEvent;
  context: Context;
}

export class AwsLambdaProxy extends ServerProxy<ApiGatewayRequest, APIGatewayProxyResult> {
  options: AwsLambdaProxyOptions;

  constructor(serverApp: ServerApp, options?: Partial<AwsLambdaProxyOptions>) {
    super(serverApp);
    this.options = Object.assign({}, defaultAwsLambdaProxyOptions, options);
  }

  normalizeError(error: Error): Promise<APIGatewayProxyResult> | APIGatewayProxyResult {
    console.log(error);
    return { body: error.message, headers: {}, statusCode: HttpStatus.BAD_GATEWAY };
  }

  normalizeRequest(proxyRequest: ApiGatewayRequest): ServerProxyRequest | Promise<ServerProxyRequest> {
    const { event, context } = proxyRequest;
    const { body, headers, ...eventRest } = event;
    return {
      path: url.format({ pathname: event.path, query: event.queryStringParameters }),
      headers: {
        ...headers,
        'x-apigateway-event': encodeURIComponent(JSON.stringify(eventRest)),
        'x-apigateway-context': encodeURIComponent(JSON.stringify(context)),
      },
      method: event.httpMethod,
      body: body ? Buffer.from(body, event.isBase64Encoded ? 'base64' : 'utf8') : undefined,
    };
  }

  normalizeResponse(serverProxyResponse: ServerProxyResponse): Promise<APIGatewayProxyResult> | APIGatewayProxyResult {
    const { headers, body, statusCode } = serverProxyResponse;
    const { binaryMimeTypes } = this.options;

    if (headers['transfer-encoding'] && headers['transfer-encoding'].includes('chunked')) {
      delete headers['transfer-encoding'];
    }
    if (body && !headers['content-length']) {
      headers['content-length'] = [String(Buffer.byteLength(body))];
    }

    const contentType = headers['content-type'] && headers['content-type'][0]
      ? headers['content-type'][0].split(';')[0]
      : '';
    const isBase64Encoded = binaryMimeTypes.includes(contentType);
    return {
      body: body.toString(isBase64Encoded ? 'base64' : 'utf8'),
      statusCode: statusCode || 200,
      multiValueHeaders: headers,
      isBase64Encoded,
    };
  }
}
