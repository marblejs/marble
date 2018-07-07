import * as fs from 'fs';
import { ContentType } from '../util/contentType.util';
import { DEFAULT_CONTENT_TYPE, contentTypeFactory, getMimeType } from './responseContentType.factory';

describe('Response content-type factory', () => {

  it('#getMimeType detects mime-type from path', () => {
    // given
    const body = new Buffer('test');
    const path = '/test/index.html';

    // when
    const mimeType = getMimeType(body, path);

    // then
    expect(mimeType).toEqual(ContentType.TEXT_HTML);
  });

  it('#getMimeType detects mime-type from buffer', () => {
    // given
    const body = fs.readFileSync(__dirname + '/../../../../assets/logo.png');
    const path = '/test/index.html';

    // when
    const mimeType = getMimeType(body, path);

    // then
    expect(mimeType).toEqual(ContentType.IMAGE_PNG);
  });

  it('#getMimeType returns DEFAULT_CONTENT_TYPE', () => {
    // given
    const body = new Buffer('test');
    const path = '/test/index';

    // when
    const mimeType = getMimeType(body, path);

    // then
    expect(mimeType).toEqual(DEFAULT_CONTENT_TYPE);
  });

  it('#contentTypeFactory returns DEFAULT_CONTENT_TYPE', () => {
    // given
    const data = { body: {}, path: '/index.html', status: 400 };

    // when
    const contentType = contentTypeFactory(data);

    // then
    expect(contentType).toEqual({ 'Content-Type': DEFAULT_CONTENT_TYPE });
  });

});
