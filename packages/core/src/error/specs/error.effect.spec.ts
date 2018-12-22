import { Marbles } from '../../+internal';
import { HttpRequest, HttpResponse } from '../../http.interface';
import { defaultError$ } from '../error.effect';
import { HttpError } from '../error.model';

const createMockRes = () => ({} as HttpResponse);
const createMockReq = (url = '/') => ({ url } as HttpRequest);

describe('defaultError$', () => {
  test('maps HttpError', () => {
    const error = new HttpError('test-message', 400);
    const expectedResponse = {
      status: 400,
      body: { error: {
        message: 'test-message',
        status: 400,
      }},
    };

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: createMockReq('/') }],
      ['-a-', { a: expectedResponse }],
    ], { client: createMockRes(), meta: error });
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

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: createMockReq('/') }],
      ['-a-', { a: expectedResponse }],
    ], { client: createMockRes(), meta: error });
  });
});
