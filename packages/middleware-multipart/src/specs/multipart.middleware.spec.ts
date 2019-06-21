import * as request from 'supertest';
import { r, use, httpListener, createContext } from '@marblejs/core';
import { multipart$ } from '../multipart.middleware';
import { map } from 'rxjs/operators';

const effect$ = r.pipe(
  r.matchPath('/'),
  r.matchType('POST'),
  r.useEffect(req$ => req$.pipe(
    use(multipart$()),
    map(req => ({ body: {
      file: req.file,
      fields: req.body,
    }}))
  )));

const app = httpListener({ effects: [effect$] }).run(createContext());

describe('multipart$', () => {
  test('parses multipart/form-data request and stores it in-memory', async () => {
    const data = Buffer.from('test_buffer_1');

    return request(app)
      .post('/')
      .field('field_1', 'test_1')
      .field('field_2', 'test_2')
      .attach('data_field', data)
      .expect(200)
      .then(({ body }) => {
        // data_field
        expect(body.file.data_field.size).toEqual(Buffer.byteLength(data));
        expect(body.file.data_field.destination).toBeUndefined();
        expect(body.file.data_field.filename).toBeUndefined();
        expect(body.file.data_field.encoding).toEqual('7bit');
        expect(body.file.data_field.mimetype).toEqual('application/octet-stream');
        expect(body.file.data_field.fieldname).toEqual('data_field');
        expect(data.equals(Buffer.from(body.file.data_field.buffer))).toBe(true);

        // field_1, field_2
        expect(body.fields.field_1).toEqual('test_1');
        expect(body.fields.field_2).toEqual('test_2');
      });
  });
});
