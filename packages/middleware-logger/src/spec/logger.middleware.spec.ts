import { Marbles, createHttpRequest, createHttpResponse } from '@marblejs/core/dist/+internal';
import { logger$, loggerWithOpts$ } from '../logger.middleware';
import { createEffectContext, createContext, lookup } from '@marblejs/core';

const createMockEffectContext = () => {
  const context = createContext();
  const client = createHttpResponse();
  return createEffectContext({ ask: lookup(context), client });
};

describe('logger$', () => {

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'error').and.stub();
  });

  test('reacts to 200 status on the console', () => {
    const ctx = createMockEffectContext();
    const request = createHttpRequest({ url: '/', method: 'GET' });

    ctx.client.statusCode = 200;

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { ctx });

    ctx.client.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

  test('reacts to 400 status on the console', () => {
    const ctx = createMockEffectContext();
    const request = createHttpRequest({ url: '/test', method: 'POST' });

    ctx.client.statusCode = 403;

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { ctx });

    ctx.client.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});

describe('loggerWithOpts$', () => {

  test('reacts to 200 status on the console', () => {
    const ctx = createMockEffectContext();
    const request = createHttpRequest({ url: '/', method: 'GET' });

    ctx.client.statusCode = 200;

    spyOn(console, 'info').and.stub();

    Marbles.assertEffect(loggerWithOpts$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { ctx });

    ctx.client.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});
