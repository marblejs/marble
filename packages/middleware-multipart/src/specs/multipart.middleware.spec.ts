import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as FormData from 'form-data';
import { pipe } from 'fp-ts/lib/pipeable';
import { map } from 'rxjs/operators';
import { r, use, httpListener } from '@marblejs/core';
import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { multipart$ } from '../multipart.middleware';
import { streamFileTo } from '../multipart.util';

const TMP_PATH = path.resolve(__dirname, '../../../../tmp');

const memoryMultipart$ = r.pipe(
  r.matchPath('/memory'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(multipart$()),
    map(req => ({ body: {
      files: req.files,
      fields: req.body,
    }}))
  )));

const memoryWithOptionsMultipart$ = r.pipe(
  r.matchPath('/memory-with-options'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(multipart$({
      maxFileCount: 1,
      maxFieldCount: 2,
      maxFileSize: 20,
    })),
    map(req => ({ body: {
      files: req.files,
      fields: req.body,
    }}))
  )));

const filesystemMultipart$ = r.pipe(
  r.matchPath('/filesystem'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(multipart$({
      stream: streamFileTo(TMP_PATH),
    })),
    map(req => ({ body: {
      files: req.files,
      fields: req.body,
    }}))
  )));

const listener = httpListener({
  effects: [
    memoryMultipart$,
    memoryWithOptionsMultipart$,
    filesystemMultipart$,
  ],
});

const testBed = createHttpTestBed({ listener });
const useTestBedSetup = createTestBedSetup({ testBed });

describe('multipart$', () => {
  const testBedSetup = useTestBedSetup();

  beforeEach(() => {
    if (!fs.existsSync(TMP_PATH)) fs.mkdirSync(TMP_PATH);
  });

  afterEach(async () => {
    if (fs.existsSync(TMP_PATH)) rimraf.sync(TMP_PATH);
    await testBedSetup.cleanup();
  });

  test('parses "multipart/form-data" request with additional fields and stores it in memory', async () => {
    const { request } = await testBedSetup.useTestBed();
    const formData = new FormData();
    const data = Buffer.from('test_buffer_1');

    formData.append('field_1', 'test_1');
    formData.append('field_2', 'test_2');
    formData.append('data_field', data);

    const response = await pipe(
      request('POST'),
      request.withPath('/memory'),
      request.withHeaders({ 'Content-Type': formData.getHeaders()['content-type'] }),
      request.withBody(formData),
      request.send,
    );

    expect(response.statusCode).toEqual(200);

    // data_field
    expect(response.body.files.data_field.size).toEqual(Buffer.byteLength(data));
    expect(response.body.files.data_field.destination).toBeUndefined();
    expect(response.body.files.data_field.filename).toBeUndefined();
    expect(response.body.files.data_field.encoding).toEqual('7bit');
    expect(response.body.files.data_field.mimetype).toEqual('application/octet-stream');
    expect(response.body.files.data_field.fieldname).toEqual('data_field');
    expect(data.equals(Buffer.from(response.body.files.data_field.buffer))).toBe(true);

    // field_1, field_2
    expect(response.body.fields.field_1).toEqual('test_1');
    expect(response.body.fields.field_2).toEqual('test_2');
  });

  test('parses "multipart/form-data" request with additional fields and stores it in filesystem', async () => {
    const { request } = await testBedSetup.useTestBed();

    const uploadFilePath = path.resolve(__dirname, '../../README.md');
    const savedFilePath = path.resolve(TMP_PATH, 'data_field');
    const file = fs.readFileSync(uploadFilePath);
    const formData = new FormData();

    formData.append('field_1', 'test_1');
    formData.append('field_2', 'test_2');
    formData.append('data_field', file, { filename: 'README.md' });

    const response = await pipe(
      request('POST'),
      request.withPath('/filesystem'),
      request.withHeaders({ 'Content-Type': formData.getHeaders()['content-type'] }),
      request.withBody(formData),
      request.send,
    );

    expect(response.statusCode).toEqual(200);

    // data_field
    expect(response.body.files.data_field.size).toBeUndefined();
    expect(response.body.files.data_field.destination).toEqual(savedFilePath);
    expect(response.body.files.data_field.filename).toEqual('README.md');
    expect(response.body.files.data_field.encoding).toEqual('7bit');
    expect(response.body.files.data_field.mimetype).toEqual('text/markdown');
    expect(response.body.files.data_field.fieldname).toEqual('data_field');
    expect(response.body.files.data_field.buffer).toBeUndefined();
    expect(fs.readFileSync(savedFilePath)).toBeDefined();

    // field_1, field_2
    expect(response.body.fields.field_1).toEqual('test_1');
    expect(response.body.fields.field_2).toEqual('test_2');

    fs.unlinkSync(savedFilePath);
  });

  test('parses "multipart/form-data" request with fields only (no files)', async () => {
    const { request } = await testBedSetup.useTestBed();
    const formData = new FormData();

    formData.append('field_1', 'test_1');
    formData.append('field_2', 'test_2');

    const response = await pipe(
      request('POST'),
      request.withPath('/memory'),
      request.withHeaders({ 'Content-Type': formData.getHeaders()['content-type'] }),
      request.withBody(formData),
      request.send,
    );

    // field_1, field_2
    expect(response.body.fields.field_1).toEqual('test_1');
    expect(response.body.fields.field_2).toEqual('test_2');
  });

  test('throws an error if incoming request is not multipart/form-data', async () => {
    const { request } = await testBedSetup.useTestBed();

    const response = await pipe(
      request('POST'),
      request.withPath('/memory'),
      request.withBody({ test: 'test' }),
      request.send,
    );

    expect(response.statusCode).toEqual(412);
    expect(response.body).toEqual({
      error: {
        status: 412,
        message: 'Content-Type must be of type multipart/form-data',
      }
    });
  });

  test('throws an error if incoming request is not "multipart/form-data"', async () => {
    const { request } = await testBedSetup.useTestBed();
    const formData = new FormData();

    formData.append('field_1', Buffer.from('test_buffer_1'));
    formData.append('field_2', Buffer.from('test_buffer_2'));

    const response = await pipe(
      request('POST'),
      request.withPath('/memory-with-options'),
      request.withHeaders({ 'Content-Type': formData.getHeaders()['content-type'] }),
      request.withBody(formData),
      request.send,
    );

    expect(response.statusCode).toEqual(412);
    expect(response.body).toEqual({
      error: {
        status: 412,
        message: 'Reached max files count limit [1]',
      }
    });
  });

  test('throws an error if max fields count limit is reached', async () => {
    const { request } = await testBedSetup.useTestBed();
    const formData = new FormData();

    formData.append('field_1', 'test_1');
    formData.append('field_2', 'test_2');
    formData.append('field_3', 'test_3');

    const response = await pipe(
      request('POST'),
      request.withPath('/memory-with-options'),
      request.withHeaders({ 'Content-Type': formData.getHeaders()['content-type'] }),
      request.withBody(formData),
      request.send,
    );

    expect(response.statusCode).toEqual(412);
    expect(response.body).toEqual({
      error: {
        status: 412,
        message: 'Reached max fields count limit [2]',
      }
    });
  });

  test('throws an error if max file size limit is reached', async () => {
    const { request } = await testBedSetup.useTestBed();
    const formData = new FormData();

    formData.append('data_field', Buffer.from(Array(100).fill(0)));

    const response = await pipe(
      request('POST'),
      request.withPath('/memory-with-options'),
      request.withHeaders({ 'Content-Type': formData.getHeaders()['content-type'] }),
      request.withBody(formData),
      request.send,
    );

    expect(response.statusCode).toEqual(412);
    expect(response.body).toEqual({
      error: {
        status: 412,
        message: 'Reached file size limit for "data_field" [20 bytes]',
      }
    });
  });
});
