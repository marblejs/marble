import { ContentType } from '@marblejs/core/dist/+internal/http';
import * as request from 'supertest';
import { app } from './bodyParser.integration';

describe('@marblejs/middleware-body - integration', () => {
  const body = { id: 'id', name: 'name', age: 100 };
  const text = 'test message';

  describe('POST /default-parser', () => {

    test(`parses ${ContentType.APPLICATION_JSON} content-type`, async () =>
      request(app)
        .post('/default-parser')
        .set({ 'Content-Type': ContentType.APPLICATION_JSON })
        .send(body)
        .expect(200, body)
    );

    test(`parses ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} content-type`, async () =>
      request(app)
        .post('/default-parser')
        .set({ 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED })
        .send(body)
        .expect(200, body)
    );
  });

  describe('POST /multiple-parsers', () => {
    test(`parses ${ContentType.APPLICATION_JSON} content-type`, async () =>
      request(app)
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.APPLICATION_JSON })
        .send(body)
        .expect(200, body)
    );

    test(`parses custom "test/json" content-type`, async () =>
      request(app)
        .post('/multiple-parsers')
        .set({ 'Content-Type': 'test/json' })
        .send(body)
        .expect(200, body)
    );

    test(`parses custom ${ContentType.APPLICATION_VND_API_JSON} content-type`, async () =>
      request(app)
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.APPLICATION_VND_API_JSON })
        .send(body)
        .expect(200, body)
    );

    test(`parses custom ${ContentType.TEXT_PLAIN} content-type`, async () =>
      request(app)
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.TEXT_PLAIN })
        .send(text)
        .expect(200, `"${text}"`)
    );

    test(`parses custom ${ContentType.APPLICATION_OCTET_STREAM} content-type`, async () =>
      request(app)
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.APPLICATION_OCTET_STREAM })
        .send(text)
        .expect(200)
        .then(({ body }) => expect(body.type).toBe('Buffer'))
    );
  });

});
