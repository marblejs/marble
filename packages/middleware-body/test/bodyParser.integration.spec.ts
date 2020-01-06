import { ContentType } from '@marblejs/core/dist/+internal/http';
import { createHttpServerTestBed } from '@marblejs/core/dist/+internal/testing';
import { createServer } from '@marblejs/core';
import * as request from 'supertest';
import { app } from './bodyParser.integration';

describe('@marblejs/middleware-body - integration', () => {
  const server = createServer({ httpListener: app });
  const httpTestBed = createHttpServerTestBed(server);

  describe('POST /default-parser', () => {
    test(`parses ${ContentType.APPLICATION_JSON} content-type`, async () =>
      request(httpTestBed.getInstance())
        .post('/default-parser')
        .set({ 'Content-Type': ContentType.APPLICATION_JSON })
        .send({ id: 'id', name: 'name', age: 100 })
        .expect(200, { id: 'id', name: 'name', age: 100 })
    );

    test(`parses ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} content-type`, async () =>
      request(httpTestBed.getInstance())
        .post('/default-parser')
        .set({ 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED })
        .send({ id: 'id', name: 'name', age: 100 })
        .expect(200, { id: 'id', name: 'name', age: '100' })
    );
  });

  describe('POST /multiple-parsers', () => {
    const body = { id: 'id', name: 'name', age: 100 };
    const text = 'test message';

    test(`parses ${ContentType.APPLICATION_JSON} content-type`, async () =>
      request(httpTestBed.getInstance())
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.APPLICATION_JSON })
        .send(body)
        .expect(200, body),
    );

    test(`parses custom "test/json" content-type`, async () =>
      request(httpTestBed.getInstance())
        .post('/multiple-parsers')
        .set({ 'Content-Type': 'test/json' })
        .send(body)
        .expect(200, body)
    );

    test(`parses ${ContentType.APPLICATION_VND_API_JSON} content-type`, async () =>
      request(httpTestBed.getInstance())
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.APPLICATION_VND_API_JSON })
        .send(body)
        .expect(200, body)
    );

    test(`parses ${ContentType.TEXT_PLAIN} content-type`, async () =>
      request(httpTestBed.getInstance())
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.TEXT_PLAIN })
        .send(text)
        .expect(200, `"${text}"`)
    );

    test(`parses ${ContentType.APPLICATION_OCTET_STREAM} content-type`, async () =>
      request(httpTestBed.getInstance())
        .post('/multiple-parsers')
        .set({ 'Content-Type': ContentType.APPLICATION_OCTET_STREAM })
        .send(text)
        .expect(200)
        .then(({ body }) => expect(body.type).toBe('Buffer'))
    );
  });

});
