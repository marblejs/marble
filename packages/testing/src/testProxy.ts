import { ServerApp, ServerProxy, ServerProxyRequest, ServerProxyResponse } from '@marblejs/proxy';
import { HttpStatus } from '@marblejs/core';
import { getContentType } from '@marblejs/core/dist/+internal';
import { defaultTestProxyOptions, TestProxyOptions, TestRequest, TestResponse } from './testProxy.options';

export class TestProxy extends ServerProxy<TestRequest, TestResponse> {
  private options: TestProxyOptions;

  constructor(app: ServerApp, options?: TestProxyOptions) {
    super(app);
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
      body: this.options.bodyFactory(headers)(body),
      method,
      path
    };
  }

  normalizeResponse(serverProxyResponse: ServerProxyResponse): TestResponse {
    const {
      headers,
      statusCode,
      statusMessage,
      body,
    } = serverProxyResponse;

    let parsedBody: any = undefined;
    try {
      parsedBody = body && this.options.bodyParser(getContentType(headers))(body);
    } catch {
      // Ignore body parser errors
    }

    return {
      headers,
      body: parsedBody,
      statusCode,
      statusMessage,
    };
  }
}
