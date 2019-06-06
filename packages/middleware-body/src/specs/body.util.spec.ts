import { createHttpRequest } from '@marblejs/core/dist/+internal/testing/http.helper';
import { hasBody } from '../body.util';

test('#hasBody checks if request has body', () => {
  expect(hasBody(createHttpRequest({ body: null }))).toEqual(false);
  expect(hasBody(createHttpRequest({ body: undefined }))).toEqual(false);
  expect(hasBody(createHttpRequest({ body: 'test' }))).toEqual(true);
  expect(hasBody(createHttpRequest({ body: {} }))).toEqual(true);
  expect(hasBody(createHttpRequest({ body: 1 }))).toEqual(true);
});
