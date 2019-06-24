import { HttpEffectResponse, httpListener, r } from '@marblejs/core';
import { map, mapTo } from 'rxjs/operators';
import { createLambda, ProxyType } from '../../';
import { awsApiGatewayMiddleware$ } from '../awsLambda.middleware';
import { bodyParser$ } from '@marblejs/middleware-body';
import { Readable } from 'stream';

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    map((req): HttpEffectResponse => ({
      status: 200,
      body: {
        path: req.path,
        body: req.body,
        event: req.apiGatewayEvent,
        context: req.apiGatewayContext,
      },
    }))
  )),
);

const chunkedTransferEncodingEffect$ = r.pipe(
  r.matchPath('/chunked-transfer'),
  r.matchType('GET'),
  r.useEffect(req$ => req$.pipe(
    mapTo(({
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
  ))
);

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
  proxyOptions: {
    logger: () => void 0,
  },
});
