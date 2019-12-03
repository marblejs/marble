import * as http from 'http';
import { Marbles, createHttpRequest } from '@marblejs/core/dist/+internal';
import { logger$, loggerWithOpts$ } from '../logger.middleware';
import { createEffectContext, createContext, lookup } from '@marblejs/core';

const createMockEffectContext = () => {
  const context = createContext();
  const client = http.createServer();
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

    request.response.statusCode = 200;

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { ctx });

    request.response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

  test('reacts to 400 status on the console', () => {
    const ctx = createMockEffectContext();
    const request = createHttpRequest({ url: '/test', method: 'POST' });

    request.response.statusCode = 403;

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { ctx });

    request.response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});

describe('loggerWithOpts$', () => {

  test('reacts to 200 status on the console', () => {
    const ctx = createMockEffectContext();
    const request = createHttpRequest({ url: '/', method: 'GET' });

    request.response.statusCode = 200;

    spyOn(console, 'info').and.stub();

    Marbles.assertEffect(loggerWithOpts$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { ctx });

    request.response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});
