<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="200" alt="Marble.js logo"/>
  </a>
</p>

# @marblejs/proxy

A simple proxy server for [Marble.js](https://github.com/marblejs/marble). It allows to send and receive requests from any server defined as `(req: IncomingMessage, res: OutgoingMessage) => void`. It is a base for `@marblejs/testing` and `@marblejs/serverless` packages.

## Installation

```
$ npm i @marblejs/proxy
```

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

```typescript
import { ServerProxy, ServerApp, ServerProxyRequest, ServerProxyResponse } from '@marblejs/proxy';

export interface MyRequest {
  headers: Record<string, string>;
  method: string;
  path: string;
  body?: string;
}

export interface MyResponse {
  headers: Record<string, string>;
  body: string;
  code: number;
}

export class MyProxy extends ServerProxy<MyRequest, MyResponse> {

  constructor(app: ServerApp) {
    super(app);
  }

  normalizeError(error: Error): MyResponse {
    return {
      code: 502,
      body: error.message,
      headers: {},
    };
  }

  normalizeRequest(proxyRequest: MyRequest): ServerProxyRequest {
    const {
      body,
      headers,
      method,
      path,
    } = proxyRequest;
    return {
      headers,
      // Convert body to buffer
      body: body !== undefined ? Buffer.from(body) : undefined,
      method,
      path
    };
  }

  normalizeResponse(serverProxyResponse: ServerProxyResponse): MyResponse {
    const {
      headers,
      body,
      statusCode,
    } = serverProxyResponse;

    return {
      // Convert multi-value headers from Record<string, string[]>
      headers: Object.keys(headers).reduce((result, key) => {
        result[key] = headers[key][0];
        return headers;
      }, {}),
      // Convert body from Buffer to string
      body: body.toString(),
      code: statusCode,
    };
  }
}

```

License: MIT
