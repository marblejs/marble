import * as O from 'fp-ts/lib/Option';
import { getContentType, getContentTypeEncoding, getContentTypeUnsafe } from './contentType.util';

describe('#getContentType', () => {
  test('returns "some" if headers object contains "Content-Type" header', () => {
    expect(getContentType({ 'content-type': ['application/json'] })).toEqual(O.some('application/json'));
    expect(getContentType({ 'Content-Type': 'application/json' })).toEqual(O.some('application/json'));
  });

  test('returns "none" if headers object does not contain "Content-Type" header', () => {
    expect(getContentType({})).toEqual(O.none);
  });
});

describe('#getContentTypeUnsafe', () => {
  test('returns content type from headers object', () => {
    expect(getContentTypeUnsafe({ 'content-type': ['application/json'] })).toEqual('application/json');
    expect(getContentTypeUnsafe({ 'Content-Type': 'application/json' })).toEqual('application/json');
  });

  test('returns empty string if headers object does not contain "Content-Type" header', () => {
    expect(getContentTypeUnsafe({})).toEqual('');
  });
});

describe('#getContentTypeEncoding', () => {
  test('returns "some" if headers object contains "Content-Type" header with "charset" part', () => {
    expect(getContentTypeEncoding({ 'content-type': 'application/json; charset=utf8' })).toEqual(O.some('utf8'));
  });

  test('returns "none" if headers object doesn\'t contain "Content-Type" header', () => {
    expect(getContentTypeEncoding({})).toEqual(O.none);
  });

  test('returns "none" if headers object doesn\'t contain "charset" part"', () => {
    expect(getContentTypeEncoding({ 'content-type': 'application/json' })).toEqual(O.none);
    expect(getContentTypeEncoding({ 'content-type': 'application/json;' })).toEqual(O.none);
    expect(getContentTypeEncoding({ 'Content-Type': 'application/json; charset' })).toEqual(O.none);
    expect(getContentTypeEncoding({ 'Content-Type': 'application/json; charset=' })).toEqual(O.none);
  });
});
