import { mapTo } from 'rxjs/operators';
import { HttpRequest, HttpResponse } from '../http.interface';
import { HttpError } from '../util/error.util';
import { Marbles } from '../util/marbles.spec-util';
import { error$, getErrorMiddleware } from './error.middleware';

const createMockRes = () => ({} as HttpResponse);
const createMockReq = (url = '/') => ({ url } as HttpRequest);

describe('Error middleware', () => {

  it('error$ maps HttpError', () => {
    const error = new HttpError('test-message', 400);
    const expectedResponse = {
      status: 400,
      body: { error: {
        message: 'test-message',
        status: 400,
      }},
    };

    Marbles.assertEffect(error$, [
      ['-a-', { a: createMockReq('/') }],
      ['-a-', { a: expectedResponse }],
    ], { response: createMockRes(), error });
  });

  it('error$ maps other errors', () => {
    const error = new Error('test-message');
    const expectedResponse = {
      status: 500,
      body: { error: {
        message: 'test-message',
        status: 500,
      }},
    };

    Marbles.assertEffect(error$, [
      ['-a-', { a: createMockReq('/') }],
      ['-a-', { a: expectedResponse }],
    ], { response: createMockRes(), error });
  });

  it('#getErrorMiddleware provides middleware implementation', () => {
    const customError$ = req$ => req$.pipe(mapTo({ status: 500, body: 'error' }));
    const middleware = getErrorMiddleware(customError$);
    expect(middleware).toBe(customError$);
  });

  it('#getErrorMiddleware provides default middleware implementation if not passed', () => {
    const middleware = getErrorMiddleware();
    expect(middleware).toBe(error$);
  });

});
