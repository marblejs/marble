import { EffectFactory, HttpEffectResponse, httpListener } from '@marblejs/core';
import { map } from 'rxjs/operators';
import { createLambda, ProxyType } from '../../';
import { awsApiGatewayMiddleware$ } from '../awsLambda.middleware';
import { bodyParser$ } from '@marblejs/middleware-body';
import { Readable } from 'stream';

const effect$ = EffectFactory
  .matchPath('/')
  .matchType('POST')
  .use(req$ => req$.pipe(
    map((req): HttpEffectResponse => ({
      status: 200,
      body: {
        path: req.path,
        body: req.body,
        event: req.apiGatewayEvent,
        context: req.apiGatewayContext,
      },
    }))
  ));

const chunkedTransferEncodingEffect$ = EffectFactory
  .matchPath('/chunked-transfer')
  .matchType('GET')
  .use(req$ => req$.pipe(
    map((): HttpEffectResponse => ({
      status: 200,
      headers: {
        'transfer-encoding': 'chunked',
      },
      body: new Readable({
        read(): void {
          this.push(JSON.stringify({ key: 'value' }));
          this.push(null);
        }
      }),
    }))
  ));

const app = httpListener({
  middlewares: [
    bodyParser$(),
    awsApiGatewayMiddleware$(),
  ],
  effects: [
    effect$,
    chunkedTransferEncodingEffect$,
  ],
});

export const createHandler = () => createLambda({
  httpListener: app,
  type: ProxyType.AWS,
  proxyOptions: {},
});
