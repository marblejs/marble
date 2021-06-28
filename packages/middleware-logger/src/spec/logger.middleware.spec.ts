import { firstValueFrom, of } from 'rxjs';
import { HttpServer } from '@marblejs/http';
import { createHttpRequest } from '@marblejs/http/dist/+internal/testing.util';
import { createEffectContext, lookup, register, LoggerToken, bindTo, createContext, Logger, EffectContext } from '@marblejs/core';
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
    await firstValueFrom(logger$()(req$, ctx));
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
    await firstValueFrom(logger$()(req$, ctx));
    req.response.emit('finish');

    // then
    expect(logger).toHaveBeenCalled();
  });
});
