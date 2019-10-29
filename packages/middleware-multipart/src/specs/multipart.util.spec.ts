import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import { createHttpRequest } from '@marblejs/core/dist/+internal/testing';
import { shouldParseFieldname, shouldParseMultipart, setRequestData, streamFileTo } from '../multipart.util';
import { FileIncomingData } from '../multipart.interface';
import { from } from 'rxjs';

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
  expect(incomingHttpRequest.files).toEqual({
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

describe('#streamFileTo', () => {
  const TMP_PATH = path.resolve(__dirname, '../../../../tmp');
  const uploadFilePath = path.resolve(__dirname, '../../README.md');
  const savedFilePath = path.resolve(TMP_PATH, 'data_field');

  afterEach(() => rimraf.sync(TMP_PATH));

  test('streams file to given path ', async () => {
    const file = fs.createReadStream(uploadFilePath);

    if (fs.existsSync(TMP_PATH)) { rimraf.sync(TMP_PATH); }

    const response = await from(streamFileTo(TMP_PATH)({
      file,
      fieldname: 'data_field',
      filename: 'README.md',
      mimetype: 'text/markdown',
      encoding: '7bit',
    })).toPromise();

    expect(response.destination).toEqual(savedFilePath);
    expect(fs.readFileSync(savedFilePath)).toBeDefined();

    fs.unlinkSync(savedFilePath);
    file.close();
  });

  test('streams file to given path ', async () => {
    const file = fs.createReadStream(uploadFilePath);

    const response = await from(streamFileTo(TMP_PATH)({
      file,
      fieldname: 'data_field',
      filename: 'README.md',
      mimetype: 'text/markdown',
      encoding: '7bit',
    })).toPromise();

    expect(response.destination).toEqual(savedFilePath);
    expect(fs.readFileSync(savedFilePath)).toBeDefined();

    fs.unlinkSync(savedFilePath);
    file.close();
  });

  test('creates folder if it doesn not exist ', async () => {
    // given
    if (fs.existsSync(TMP_PATH)) { rimraf.sync(TMP_PATH); }

    // when
    streamFileTo(TMP_PATH);

    // then
    expect(fs.existsSync(TMP_PATH)).toEqual(true);
  });

  test('does not create folder if exists ', async () => {
    // given
    if (!fs.existsSync(TMP_PATH)) { fs.mkdirSync(TMP_PATH); }

    // when
    streamFileTo(TMP_PATH);

    // then
    expect(fs.existsSync(TMP_PATH)).toEqual(true);
  });
});
