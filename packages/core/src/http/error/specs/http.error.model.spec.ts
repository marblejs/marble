import { HttpError, isHttpError } from '../http.error.model';

describe('Http error model', () => {

  test('#HttpError creates error object', () => {
    const error = new HttpError('test-message', 200);

    expect(error.name).toBe('HttpError');
    expect(error.status).toBe(200);
    expect(error.message).toBe('test-message');
  });

  test('#isHttpError detects HttpError type', () => {
    const httpError = new HttpError('test-message', 200);
    const otherError = new Error();

    expect(isHttpError(httpError)).toBe(true);
    expect(isHttpError(otherError)).toBe(false);
  });

});
