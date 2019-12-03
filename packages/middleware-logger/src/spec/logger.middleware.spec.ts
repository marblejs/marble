import * as http from 'http';
import { of } from 'rxjs';
import { createHttpRequest } from '@marblejs/core/dist/+internal';
import { logger$, loggerWithOpts$ } from '../logger.middleware';
import { createEffectContext, createContext, lookup } from '@marblejs/core';

const createMockEffectContext = () => {
  const context = createContext();
  const client = http.createServer();
  return createEffectContext({ ask: lookup(context), client });
};

beforeEach(() => {
  spyOn(console, 'log').and.stub();
  spyOn(console, 'info').and.stub();
  spyOn(console, 'error').and.stub();
});

describe('logger$', () => {
  test('reacts to 200 status on the console', async () => {
    // given
    const ctx = createMockEffectContext();
    const req = createHttpRequest({ url: '/', method: 'GET' });
    req.response.statusCode = 200;

    // when
    await logger$()(of(req), ctx).toPromise();
    req.response.emit('finish');

    // then
    expect(console.info).toHaveBeenCalled();
  });

  test('reacts to 400 status on the console', async () => {
    // given
    const ctx = createMockEffectContext();
    const req = createHttpRequest({ url: '/test', method: 'POST' });
    req.response.statusCode = 403;

    // when
    await logger$()(of(req), ctx).toPromise();
    req.response.emit('finish');

    // then
    expect(console.info).toHaveBeenCalled();
  });
});

describe('loggerWithOpts$', () => {
  test('reacts to 200 status on the console', async () => {
    // given
    const ctx = createMockEffectContext();
    const req = createHttpRequest({ url: '/', method: 'GET' });
    req.response.statusCode = 200;

    // when
    await loggerWithOpts$()(of(req), ctx).toPromise();
    req.response.emit('finish');

    // then
    expect(console.info).toHaveBeenCalled();
  });
});
