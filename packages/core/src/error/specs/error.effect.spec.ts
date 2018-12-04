import { mapTo } from 'rxjs/operators';
import { Marbles } from '../../+internal';
import { HttpRequest, HttpResponse } from '../../http.interface';
import { error$, errorEffectProvider } from '../error.effect';
import { HttpError } from '../error.model';

const createMockRes = () => ({} as HttpResponse);
const createMockReq = (url = '/') => ({ url } as HttpRequest);

describe('error$', () => {
  test('maps HttpError', () => {
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

  test('maps other errors', () => {
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
});

describe('#errorEffectProvider', () => {
  test('provides error handler implementation', () => {
    const customError$ = req$ => req$.pipe(mapTo({ status: 500, body: 'error' }));
    const effect = errorEffectProvider(customError$);
    expect(effect).toBe(customError$);
  });

  test('provides default error handler implementation if not passed', () => {
    const effect = errorEffectProvider();
    expect(effect).toBe(error$);
  });
});
