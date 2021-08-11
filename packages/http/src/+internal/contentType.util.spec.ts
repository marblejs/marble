import * as fs from 'fs';
import * as path from 'path';
import * as O from 'fp-ts/lib/Option';
import { ContentType, getContentType, getContentTypeEncoding, getContentTypeUnsafe, getMimeType } from './contentType.util';

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

  test('returns "some" if provided "Content-Type" value directly with "charset" part', () => {
    expect(getContentTypeEncoding('application/json; charset=utf8')).toEqual(O.some('utf8'));
  });

  test('returns "some" with lowercased "charset" part', () => {
    expect(getContentTypeEncoding('application/json; charset=UTF8')).toEqual(O.some('utf8'));
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

describe('#getMimeType', () => {
  test('detects mime-type from path', () => {
    // given
    const body = Buffer.from('test');
    const pathToIndex = '/test/index.html';

    // when
    const mimeType = getMimeType(body, pathToIndex);

    // then
    expect(mimeType).toEqual(ContentType.TEXT_HTML);
  });

  test('detects mime-type from buffer', () => {
    // given
    const body = fs.readFileSync(path.resolve(__dirname, '../../../../assets/img', 'logo.png'));
    const pathToIndex = '/test/index.html';

    // when
    const mimeType = getMimeType(body, pathToIndex);

    // then
    expect(mimeType).toEqual(ContentType.IMAGE_PNG);
  });

  test('returns null if cannot guess mime-type ', () => {
    // given
    const body = Buffer.from('test');
    const pathToIndex = '/test/index';

    // when
    const mimeType = getMimeType(body, pathToIndex);

    // then
    expect(mimeType).toEqual(null);
  });
});
