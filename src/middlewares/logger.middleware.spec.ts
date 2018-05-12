import { EventEmitter } from 'events';
import { HttpRequest, HttpResponse } from '../http.interface';
import { Marbles } from '../util/marbles.spec-util';
import { logger$ } from './logger.middleware';

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

  it('reacts to 200 status on the console', async () => {
    const request = createMockReq('/', 'GET');
    const response = createMockRes(200);

    Marbles.assertEffect(logger$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { response });

    response.emit('finish');

    setTimeout(() => expect(console.log).toHaveBeenCalled(), 10);
  });

  it('reacts to 400 status on the console', async () => {
    const request = createMockReq('/test', 'POST');
    const response = createMockRes(403);

    Marbles.assertEffect(logger$, [
      ['-a-', { a: request }],
      ['-a-', { a: request }],
    ], { response });

    response.emit('finish');

    setTimeout(() => expect(console.log).toHaveBeenCalled(), 10);
  });

});
