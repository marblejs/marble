import { Marbles } from '@marblejs/core/dist/+internal/testing';
import { createHttpRequest, createHttpResponse } from '../+internal/testing.util';
import { defaultError$ } from './http.error.effect';
import { HttpError } from './http.error.model';

describe('defaultError$', () => {
  const req = createHttpRequest();
  const client = createHttpResponse();
  const ctx = { client };

  test('maps HttpError', () => {
    const error = new HttpError('test-message', 400);
    const outgoingResponse = {
      status: 400,
      body: { error: {
        message: 'test-message',
        status: 400,
      }},
    };

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: { req, error } }],
      ['-a-', { a: { req, res: outgoingResponse } }],
    ], { ctx });
  });

  test('maps other errors', () => {
    const error = new Error('test-message');
    const outgoingResponse = {
      status: 500,
      body: { error: {
        message: 'test-message',
        status: 500,
      }},
    };

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: { req, error } }],
      ['-a-', { a: { req, res: outgoingResponse } }],
    ], { ctx });
  });

  test('maps to "Internal server error" if "error" is not provided', () => {
    const error = undefined;
    const outgoingResponse = {
      status: 500,
      body: { error: {
        message: 'Internal server error',
        status: 500,
      }}
    };

    Marbles.assertEffect(defaultError$, [
      ['-a-', { a: { req, error } }],
      ['-a-', { a: { req, res: outgoingResponse } }],
    ], { ctx });
  });
});
