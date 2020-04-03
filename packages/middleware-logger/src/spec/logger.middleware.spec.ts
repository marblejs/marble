import { of } from 'rxjs';
import { createHttpRequest } from '@marblejs/core/dist/+internal/testing';
import { createEffectContext, lookup, register, LoggerToken, bindTo, createContext, HttpServer, Logger, EffectContext } from '@marblejs/core';
import { logger$ } from '../logger.middleware';

describe('logger$', () => {
  let logger: Logger;
  let ctx: EffectContext<HttpServer>;

  beforeEach(() => {
    const client = jest.fn() as any as HttpServer;
    logger = jest.fn(() => jest.fn());

    const boundLogger = bindTo(LoggerToken)(() => logger);
    const context = register(boundLogger)(createContext());

    ctx = createEffectContext({ ask: lookup(context), client });
  });

  test('reacts to 200 status', async () => {
    // given
    const req = createHttpRequest({ url: '/', method: 'GET' });
    const req$ = of(req);
    req.response.statusCode = 200;

    // when
    await logger$()(req$, ctx).toPromise();
    req.response.emit('finish');

    // then
    expect(logger).toHaveBeenCalled();
  });

  test('reacts to 400 status', async () => {
    // given
    const req = createHttpRequest({ url: '/test', method: 'POST' });
    const req$ = of(req);
    req.response.statusCode = 403;

    // when
    await logger$()(req$, ctx).toPromise();
    req.response.emit('finish');

    // then
    expect(logger).toHaveBeenCalled();
  });
});
