import { createHttpRequest } from '@marblejs/core/dist/+internal/testing/http.helper';
import { hasBody } from '../body.util';

test('#hasBody checks if request has body', () => {
  expect(hasBody(createHttpRequest({ url: '/', body: null }))).toEqual(false);
  expect(hasBody(createHttpRequest({ url: '/', body: undefined }))).toEqual(false);
  expect(hasBody(createHttpRequest({ url: '/', body: 'test' }))).toEqual(true);
  expect(hasBody(createHttpRequest({ url: '/', body: {} }))).toEqual(true);
  expect(hasBody(createHttpRequest({ url: '/', body: 1 }))).toEqual(true);
});
