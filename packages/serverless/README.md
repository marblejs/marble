<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="200" alt="Marble.js logo"/>
  </a>
</p>

# @marblejs/serverless

AWS Lambda serverless proxy for [Marble.js](https://github.com/marblejs/marble). Based on work of [@mflorence99](https://github.com/mflorence99/aws-serverless-marblejs).

## Installation

```
$ npm i @marblejs/serverless
```
Requires `@marblejs/core` to be installed.

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

```ts
import { createLambda, ProxyType } from '@marblejs/severless';
import httpListener from './httpListener';

export = createLambda({
  httpListener, // Your app goes here
  type: ProxyType.AWS, // Currently we support only AWS Lambda with API Gateway
  proxyOptions: { // Optional configuration for specified ProxyType
    binaryMimeTypes: ['application/octet-stream'], 
  },
});
```

License: MIT
