import * as url from 'url';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { HttpMethod, HttpStatus } from '@marblejs/core';
import { getHeaderByKey, ServerApp, ServerProxy, ServerProxyRequest, ServerProxyResponse } from '@marblejs/proxy';
import { defaultAwsLambdaProxyOptions } from './awsLambdaProxy.options';
import { AwsLambdaHeaders, AwsLambdaProxyOptions } from './awsLambda.types';

interface ApiGatewayRequest {
  event: APIGatewayProxyEvent;
  context: Context;
}

export class AwsLambdaProxy extends ServerProxy<ApiGatewayRequest, APIGatewayProxyResult> {
  options: AwsLambdaProxyOptions;

  constructor(serverApp: ServerApp, options?: Partial<AwsLambdaProxyOptions>) {
    super(serverApp);
    this.options = Object.assign({}, defaultAwsLambdaProxyOptions, options);
    this.log = this.options.logger;
  }

  normalizeError(error: Error): APIGatewayProxyResult {
    console.log(error);
    return { body: error.message, headers: {}, statusCode: HttpStatus.BAD_GATEWAY };
  }

  normalizeRequest(proxyRequest: ApiGatewayRequest): ServerProxyRequest {
    const { event, context } = proxyRequest;
    const { body, headers, ...eventRest } = event;
    return {
      path: url.format({ pathname: event.path, query: event.queryStringParameters }),
      headers: {
        ...headers,
        [AwsLambdaHeaders.APIGATEWAY_EVENT]: encodeURIComponent(JSON.stringify(eventRest)),
        [AwsLambdaHeaders.AWSLAMBDA_CONTEXT]: encodeURIComponent(JSON.stringify(context)),
      },
      method: event.httpMethod as HttpMethod,
      body: body ? Buffer.from(body, event.isBase64Encoded ? 'base64' : 'utf8') : undefined,
    };
  }

  normalizeResponse(serverProxyResponse: ServerProxyResponse): APIGatewayProxyResult {
    const { headers, body, statusCode } = serverProxyResponse;
    const { binaryMimeTypes } = this.options;

    if (headers['transfer-encoding'] && headers['transfer-encoding'].includes('chunked')) {
      delete headers['transfer-encoding'];
    }
    if (body && !headers['Content-Length']) {
      headers['Content-Length'] = [String(Buffer.byteLength(body))];
    }

    const contentType = getHeaderByKey(headers, 'content-type') || '';
    const isBase64Encoded = binaryMimeTypes.includes(contentType.split(';')[0]);
    return {
      body: body ? body.toString(isBase64Encoded ? 'base64' : 'utf8') : '',
      statusCode,
      multiValueHeaders: headers,
      isBase64Encoded,
    };
  }
}
