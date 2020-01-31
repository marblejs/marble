import { createHttpRequest } from '../../testing';
import { getHeaderValueHead } from '../http.util';

test('#getHeaderValueHead', () => {
  const headers = {
    'x-test-1': 'a',
    'x-test-2': ['b', 'c'],
  }
  const req = createHttpRequest({ headers });

  expect(getHeaderValueHead('x-test-1')(req)).toEqual('a');
  expect(getHeaderValueHead('x-test-2')(req)).toEqual('b');
  expect(getHeaderValueHead('x-test-3')(req)).toBeUndefined();
});
