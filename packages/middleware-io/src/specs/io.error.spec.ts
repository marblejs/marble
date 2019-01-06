import { IOError, isIOError } from '../io.error';

test('#isIOError checks if error is of type IOError', () => {
  const ioError = new IOError('test', {});
  const otherError = new Error();

  expect(isIOError(ioError)).toBe(true);
  expect(isIOError(otherError)).toBe(false);
});
