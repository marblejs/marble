import { getContentType } from './contentType.util';

test('#getContentType returns content type from headers object', () => {
  const contentType = 'application/json';
  expect(getContentType({ 'content-type': [contentType] })).toBe(contentType);
  expect(getContentType({ 'Content-Type': contentType })).toBe(contentType);
});

test('#getContentType returns empty string if headers object does not contain Content-Type header', () => {
  expect(getContentType({})).toBe('');
});
