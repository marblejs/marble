import { getHeaderByKey, ServerApp, ServerProxy, ServerProxyRequest, ServerProxyResponse } from '@marblejs/proxy';
import { HttpStatus } from '@marblejs/core';
import { defaultTestProxyOptions, TestProxyOptions, TestRequest, TestResponse } from './testProxy.options';

const normalizeBody = (contentType: string, body: any): Buffer => {
  if (body === undefined || Buffer.isBuffer(body)) {
    return body;
  }
  if (typeof body === 'object') {
    if (contentType.match(/application\/.*json/)) {
      return Buffer.from(JSON.stringify(body));
    }
  }
  return Buffer.from(String(body));
};

export class TestProxy extends ServerProxy<TestRequest, TestResponse> {
  private options: TestProxyOptions;

  constructor(app: ServerApp, options?: TestProxyOptions) {
    super(app, () => void 0);
    this.options = Object.assign({}, defaultTestProxyOptions, options);
  }

  normalizeError(error: Error): TestResponse {
    const { name, message, stack } = error;
    return {
      statusCode: HttpStatus.BAD_GATEWAY,
      statusMessage: 'Bad Gateway',
      body: {
        name, message, stack,
      },
      headers: {},
    };
  }

  normalizeRequest(proxyRequest: TestRequest): ServerProxyRequest {
    const {
      body,
      headers,
      protocol = 'http:',
      host = 'localhost',
      method,
      path,
    } = proxyRequest;

    return {
      host,
      protocol,
      headers,
      body: normalizeBody(String(getHeaderByKey(headers, 'Content-Type')), body),
      method,
      path
    };
  }

  normalizeResponse(serverProxyResponse: ServerProxyResponse): TestResponse {
    const {
      headers,
      statusCode,
      statusMessage,
    } = serverProxyResponse;

    return {
      headers,
      body: this.options.bodyParser(serverProxyResponse),
      statusCode,
      statusMessage,
    };
  }
}
