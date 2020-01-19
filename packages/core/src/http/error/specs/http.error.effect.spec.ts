import { Marbles, createHttpResponse, createHttpRequest } from '../../../+internal/testing';
import { defaultError$ } from '../http.error.effect';
import { HttpError } from '../http.error.model';

describe('defaultError$', () => {
  const req = createHttpRequest();
  const client = createHttpResponse();
  const ctx = { client };

  test('maps HttpError', () => {
    const error = new HttpError('test-message', 400);
    const incomingRequest = { req, error };
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
    ], { ctx });
  });

  test('maps other errors', () => {
    const error = new Error('test-message');
    const incomingRequest = { req, error };
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
    ], { ctx });
  });

  test('maps to "Internal server error" if "error" is not provided', () => {
    const error = undefined;
    const incomingRequest = { req, error };
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
    ], { ctx });
  });
});
