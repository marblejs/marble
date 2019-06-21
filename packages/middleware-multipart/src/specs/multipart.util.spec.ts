import { createHttpRequest } from '@marblejs/core/dist/+internal/testing';
import { shouldParseFieldname, shouldParseMultipart, setRequestData } from '../multipart.util';
import { FileIncomingData } from '../multipart.interface';

test('#shouldParseFieldname checks if given fieldname can be parsed by middleware', () => {
  expect(shouldParseFieldname(undefined)('test')).toEqual(true);
  expect(shouldParseFieldname(['test_1'])('test_1')).toEqual(true);
  expect(shouldParseFieldname(['test_1'])('test_2')).toEqual(false);
  expect(shouldParseFieldname([])('test')).toEqual(false);
});

test('#shouldParseMultipart checks if incoming request can be parsed by middleware', () => {
  // given
  const multipartRequest = createHttpRequest({
    method: 'POST',
    headers: { 'Content-Type': 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW'},
  });

  const nonMultipartRequest1 = createHttpRequest({
    method: 'GET',
    headers: { 'Content-Type': 'application/json'},
  });

  const nonMultipartRequest2 = createHttpRequest({
    method: 'POST',
    headers: { 'Content-Type': 'application/json'},
  });

  // then
  expect(shouldParseMultipart(multipartRequest)).toEqual(true);
  expect(shouldParseMultipart(nonMultipartRequest1)).toEqual(false);
  expect(shouldParseMultipart(nonMultipartRequest2)).toEqual(false);
});

test('#setRequestData sets file related request data', () => {
  // given
  const bufferedData = Buffer.from('test');
  const bufferedDataLength = Buffer.byteLength(bufferedData);
  const incomingHttpRequest = createHttpRequest();
  const incomingFile: FileIncomingData = {
    mimetype: 'image/svg+xml',
    encoding: '7bit',
    fieldname: 'image_1',
    filename: 'shape.svg',
    file: undefined as any as NodeJS.ReadableStream,
  };
  const computedFileData = {
    buffer: bufferedData,
    size: bufferedDataLength,
    destination: 'test/path/to/file',
  };

  // when
  setRequestData(incomingHttpRequest)(incomingFile)(computedFileData);

  // then
  expect(incomingHttpRequest.file).toEqual({
    'image_1': {
      size: bufferedDataLength,
      buffer: bufferedData,
      destination: computedFileData.destination,
      encoding: incomingFile.encoding,
      mimetype: incomingFile.mimetype,
      filename: incomingFile.filename,
      fieldname: incomingFile.fieldname,
    },
  })
});
