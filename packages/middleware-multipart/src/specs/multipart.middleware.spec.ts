import * as fs from 'fs';
import * as path from 'path';
import * as rimraf from 'rimraf';
import * as request from 'supertest';
import { map } from 'rxjs/operators';
import { r, use, httpListener, createServer } from '@marblejs/core';
import { createHttpServerTestBed } from '@marblejs/core/dist/+internal/testing';
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

const server = createServer({
  httpListener: httpListener({
    effects: [memoryMultipart$, memoryWithOptionsMultipart$, filesystemMultipart$],
  }),
});

describe('multipart$', () => {
  const httpTestBed = createHttpServerTestBed(server);

  afterEach(() => {
    if (fs.existsSync(TMP_PATH)) { rimraf.sync(TMP_PATH); }
  });

  test('parses multipart/form-data request with additional fields and stores it in-memory', async () => {
    const data = Buffer.from('test_buffer_1');

    return request(httpTestBed.getInstance())
      .post('/memory')
      .field('field_1', 'test_1')
      .field('field_2', 'test_2')
      .attach('data_field', data)
      .expect(200)
      .then(({ body }) => {
        // data_field
        expect(body.files.data_field.size).toEqual(Buffer.byteLength(data));
        expect(body.files.data_field.destination).toBeUndefined();
        expect(body.files.data_field.filename).toBeUndefined();
        expect(body.files.data_field.encoding).toEqual('7bit');
        expect(body.files.data_field.mimetype).toEqual('application/octet-stream');
        expect(body.files.data_field.fieldname).toEqual('data_field');
        expect(data.equals(Buffer.from(body.files.data_field.buffer))).toBe(true);

        // field_1, field_2
        expect(body.fields.field_1).toEqual('test_1');
        expect(body.fields.field_2).toEqual('test_2');
      });
  });

  test('parses multipart/form-data request with additional fields and stores it filesystem', async () => {
    const uploadFilePath = path.resolve(__dirname, '../../README.md');
    const savedFilePath = path.resolve(TMP_PATH, 'data_field');
    const file = fs.readFileSync(uploadFilePath);

    return request(httpTestBed.getInstance())
      .post('/filesystem')
      .field('field_1', 'test_1')
      .field('field_2', 'test_2')
      .attach('data_field', file, { filename: 'README.md' })
      .expect(200)
      .then(({ body }) => {
        // data_field
        expect(body.files.data_field.size).toBeUndefined();
        expect(body.files.data_field.destination).toEqual(savedFilePath);
        expect(body.files.data_field.filename).toEqual('README.md');
        expect(body.files.data_field.encoding).toEqual('7bit');
        expect(body.files.data_field.mimetype).toEqual('text/markdown');
        expect(body.files.data_field.fieldname).toEqual('data_field');
        expect(body.files.data_field.buffer).toBeUndefined();
        expect(fs.readFileSync(savedFilePath)).toBeDefined();

        // field_1, field_2
        expect(body.fields.field_1).toEqual('test_1');
        expect(body.fields.field_2).toEqual('test_2');

        fs.unlinkSync(savedFilePath);
      });
  });

  test('throws an error if incoming request is not multipart/form-data', async () =>
    request(httpTestBed.getInstance())
      .post('/memory')
      .send({ test: 'test' })
      .expect(412)
      .expect({
        error: {
          status: 412,
          message: 'Content-Type must be of type multipart/form-data',
        }
      }),
  );

  test('throws an error if max files count limit is reached', async () => {
    const data1 = Buffer.from('test_buffer_1');
    const data2 = Buffer.from('test_buffer_2');

    return request(httpTestBed.getInstance())
      .post('/memory-with-options')
      .attach('data_field_1', data1)
      .attach('data_field_2', data2)
      .expect(412)
      .expect({
        error: {
          status: 412,
          message: 'Reached max files count limit [1]',
        }
      });
  });

  test('throws an error if max fields count limit is reached', async () => {
    return request(httpTestBed.getInstance())
      .post('/memory-with-options')
      .field('field_1', 'test_1')
      .field('field_2', 'test_2')
      .field('field_3', 'test_3')
      .expect(412)
      .expect({
        error: {
          status: 412,
          message: 'Reached max fields count limit [2]',
        }
      });
  });

  test('throws an error if max file size limit is reached', async () => {
    const data = Buffer.from(Array(100).fill(0));

    return request(httpTestBed.getInstance())
      .post('/memory-with-options')
      .attach('data_field', data)
      .expect(412)
      .expect({
        error: {
          status: 412,
          message: 'Reached file size limit for "data_field" [20 bytes]',
        }
      });
  });
});
