import { ExtendableError, HttpError, isHttpError, CoreError } from '../error.model';

describe('Error model', () => {

  beforeEach(() => {
    jest.spyOn(Error, 'captureStackTrace');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('#ExtendableError creates error object', () => {
    const error = new ExtendableError('TestError', 'test-message');

    expect(error.name).toBe('TestError');
    expect(error.message).toBe('test-message');
  });

  test('#HttpError creates error object', () => {
    const error = new HttpError('test-message', 200);

    expect(error.name).toBe('HttpError');
    expect(error.status).toBe(200);
    expect(error.message).toBe('test-message');
  });

  test('#CoreError creates error object', () => {
    // given
    const stackTraceFactory = jest.fn();
    const error = new CoreError('test-message', {
      context: {},
      stackTraceFactory,
    });

    // when
    Error.prepareStackTrace!(error, []);

    // then
    expect(error.name).toBe('CoreError');
    expect(error.message).toBe('test-message');
    expect(Error.captureStackTrace).toHaveBeenCalled();
    expect(stackTraceFactory).toHaveBeenCalledWith('test-message', []);
  });

  test('#isHttpError detects HttpError type', () => {
    const httpError = new HttpError('test-message', 200);
    const otherError = new Error();

    expect(isHttpError(httpError)).toBe(true);
    expect(isHttpError(otherError)).toBe(false);
  });

});
