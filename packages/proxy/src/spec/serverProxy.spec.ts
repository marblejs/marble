import { loggerMock, MyProxy, sleep } from './serverProxy.spec-setup';
import { createMarbleServer } from './server.spec-setup';
import { HttpStatus } from '@marblejs/core';

describe('@marblejs/proxy - Server Proxy', () => {
  const app = createMarbleServer();

  test('can be set up and successfully run queries sequentially as in example', async () => {
    const logger = loggerMock();
    const proxy = new MyProxy(app, logger.log);

    for (let i = 0; i < 2; i++) {
      const response = await proxy.handle({
        method: 'POST',
        path: '/',
        body: 'testBody',
        headers: { 'Content-Type': 'text/plain' },
      });

      expect(response.code).toBe(200);
      expect(response.body).toEqual('testBody');
    }

    proxy.close();
    await sleep(1000);
    expect(logger.message(-1)).toContain('closed');
  });

  test('handles server errors gracefully', async () => {
    const proxy = new MyProxy(app, jest.fn());

    const response = await proxy.handle({
      method: 'GET',
      path: '/',
    });

    expect(response.code).toBe(502);
    expect(response.body).toContain('Parse Error');

    proxy.close();
  });

  test('handles proxy socket name collision errors gracefully', async () => {
    const logger = loggerMock();
    const proxy = new MyProxy(app, logger.log);
    const error: NodeJS.ErrnoException = new Error('Test error');
    error.code = 'EADDRINUSE';
    proxy.emitError(error);
    await sleep(1000);
    expect(logger.message(-3)).toContain('Test error');
    expect(logger.message(-2)).toContain('closed');
    expect(logger.message(-1)).toContain('listening');

    proxy.close();
  });
  test('handles invalid requests gracefully', async () => {
    const logger = loggerMock();
    const proxy = new MyProxy(app, logger.log);
    const response = await proxy.handle({
      method: true,
    } as any);

    expect(logger.message(-1)).toContain('TypeError');
    expect(response.code).toEqual(HttpStatus.BAD_GATEWAY);

    proxy.close();
  });

  test('logs proxy errors', async () => {
    const logger = loggerMock();
    const proxy = new MyProxy(app, logger.log);
    const error = new Error('Sample error');
    proxy.emitError(error);
    await sleep(1000);
    expect(logger.message(-1)).toContain('Sample error');
    proxy.close();
  });
});
