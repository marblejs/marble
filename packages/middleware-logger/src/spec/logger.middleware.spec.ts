import { Marbles, createHttpRequest, createHttpResponse } from '@marblejs/core/dist/+internal';
import { logger$, loggerWithOpts$ } from '../logger.middleware';

describe('logger$', () => {

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'error').and.stub();
  });

  test('reacts to 200 status on the console', () => {
    const request = createHttpRequest({ url: '/', method: 'GET' });
    const response = createHttpResponse({ statusCode: 200 });

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { client: response });

    response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

  test('reacts to 400 status on the console', () => {
    const request = createHttpRequest({ url: '/test', method: 'POST' });
    const response = createHttpResponse({ statusCode: 403 });

    Marbles.assertEffect(logger$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { client: response });

    response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});

describe('loggerWithOpts$', () => {

  test('reacts to 200 status on the console', () => {
    const request = createHttpRequest({ url: '/', method: 'GET' });
    const response = createHttpResponse({ statusCode: 200 });

    spyOn(console, 'info').and.stub();

    Marbles.assertEffect(loggerWithOpts$(), [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { client: response });

    response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});
