import { Marbles, createHttpResponse, createHttpRequest } from '../../+internal';
import { defaultError$ } from '../error.effect';
import { HttpError } from '../error.model';

describe('defaultError$', () => {
  const incomingRequest = createHttpRequest({ url: '/' });
  const client = createHttpResponse();

  test('maps HttpError', () => {
    const incomingError = new HttpError('test-message', 400);
    const outgoingResponse = {
      status: 400,
      body: { error: {
        message: 'test-message',
        status: 400,
      }},
    };

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: incomingRequest }],
      ['-a-', { a: outgoingResponse }],
    ], { client, meta: incomingError });
  });

  test('maps other errors', () => {
    const incomingError = new Error('test-message');
    const outgoingResponse = {
      status: 500,
      body: { error: {
        message: 'test-message',
        status: 500,
      }},
    };

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: incomingRequest }],
      ['-a-', { a: outgoingResponse }],
    ], { client, meta: incomingError });
  });

  test('maps to "Internal server error" if "error" is not provided', () => {
    const outgoingResponse = {
      status: 500,
      body: { error: {
        message: 'Internal server error',
        status: 500,
      }}
    };

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: incomingRequest }],
      ['-a-', { a: outgoingResponse }],
    ], { client });
  });
});
