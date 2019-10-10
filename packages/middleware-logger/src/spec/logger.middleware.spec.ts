import { Marbles, createHttpRequest, createHttpResponse } from '@marblejs/core/dist/+internal';
import { logger$, loggerWithOpts$ } from '../logger.middleware';
import { createEffectMetadata, createContext, lookup } from '@marblejs/core';

const createMockMetadata = () => {
  const context = createContext();
  const client = createHttpResponse();
  return createEffectMetadata({ ask: lookup(context), client });
};

describe('logger$', () => {

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'error').and.stub();
  });

  test('reacts to 200 status on the console', () => {
    const meta = createMockMetadata();
    const request = createHttpRequest({ url: '/', method: 'GET' });

    meta.client.statusCode = 200;

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { meta });

    meta.client.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

  test('reacts to 400 status on the console', () => {
    const meta = createMockMetadata();
    const request = createHttpRequest({ url: '/test', method: 'POST' });

    meta.client.statusCode = 403;

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { meta });

    meta.client.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});

describe('loggerWithOpts$', () => {

  test('reacts to 200 status on the console', () => {
    const meta = createMockMetadata();
    const request = createHttpRequest({ url: '/', method: 'GET' });

    meta.client.statusCode = 200;

    spyOn(console, 'info').and.stub();

    Marbles.assertEffect(loggerWithOpts$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { meta });

    meta.client.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});
