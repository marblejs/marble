import { HttpRequest, HttpResponse } from '@marblejs/core';
import { Marbles } from '@marblejs/core/dist/+internal';
import { EventEmitter } from 'events';
import { logger$ } from '../logger.middleware';

const createMockReq = (url: string, method: string) => ({ url, method } as HttpRequest);
const createMockRes = (status: number) => new class extends EventEmitter {
  statusCode = status;
} as HttpResponse;

describe('Logger middleware', () => {

  beforeEach(() => {
    spyOn(console, 'log').and.stub();
    spyOn(console, 'info').and.stub();
    spyOn(console, 'error').and.stub();
  });

  test('reacts to 200 status on the console', () => {
    const request = createMockReq('/', 'GET');
    const response = createMockRes(200);

    Marbles.assertEffect(logger$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { client: response });

    response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

  test('reacts to 400 status on the console', () => {
    const request = createMockReq('/test', 'POST');
    const response = createMockRes(403);

    Marbles.assertEffect(logger$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { client: response });

    response.emit('finish');
    expect(console.info).toHaveBeenCalled();
  });

});
