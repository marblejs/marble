import * as url from 'url';
import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { HttpStatus } from '@marblejs/core';
import { ServerApp, ServerProxy, ServerProxyRequest, ServerProxyResponse } from '../serverProxy';
import { defaultAwsLambdaProxyOptions } from './awsLambdaProxy.options';
import { AwsLambdaHeaders, AwsLambdaProxyOptions } from './awsLambda.types';
import { HttpMethod } from '@marblejs/core';

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
    // TODO Use getHeaderByKey from proxy utils that will be available in upcoming PR
    if (body && !headers['Content-Length']) {
      headers['Content-Length'] = [String(Buffer.byteLength(body))];
    }

    const contentType = headers['content-type'] && headers['content-type'][0]
      ? headers['content-type'][0].split(';')[0]
      : '';
    const isBase64Encoded = binaryMimeTypes.includes(contentType);
    return {
      body: body.toString(isBase64Encoded ? 'base64' : 'utf8'),
      statusCode: statusCode || HttpStatus.OK,
      multiValueHeaders: headers,
      isBase64Encoded,
    };
  }
}
