import { ExtendableError, HttpError, isHttpError } from './error.util';

describe('Error', () => {

  it('#ExtendableError creates error object', () => {
    const error = new ExtendableError('TestError', 'test-message');
    expect(error.name).toBe('TestError');
    expect(error.message).toBe('test-message');
  });

  it('#HttpError creates error object', () => {
    const error = new HttpError('test-message', 200);
    expect(error.name).toBe('HttpError');
    expect(error.status).toBe(200);
    expect(error.message).toBe('test-message');
  });

  it('#isHttpError detects HttpError type', () => {
    const httpError = new HttpError('test-message', 200);
    const otherError = new Error();

    expect(isHttpError(httpError)).toBe(true);
    expect(isHttpError(otherError)).toBe(false);
  });

});
