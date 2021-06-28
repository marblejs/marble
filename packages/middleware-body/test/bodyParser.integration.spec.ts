import { ContentType } from '@marblejs/http/dist/+internal/contentType.util';
import { bufferFrom, stringifyJson } from '@marblejs/core/dist/+internal/utils';
import { pipe } from 'fp-ts/lib/function';
import { createHttpTestBed, createTestBedSetup } from '@marblejs/testing';
import { listener } from './bodyParser.integration';

const testBed = createHttpTestBed({ listener });
const useTestBedSetup = createTestBedSetup({ testBed });

describe('@marblejs/middleware-body - integration', () => {
  const testBedSetup = useTestBedSetup();

  afterEach(async () => {
    await testBedSetup.cleanup();
  });

  describe('default parser', () => {
    test(`parses ${ContentType.APPLICATION_JSON} content-type`, async () => {
      const { request } = await testBedSetup.useTestBed();
      const body = { id: 'id', name: 'name', age: 100 };

      const response = await pipe(
        request('POST'),
        request.withPath('/default-parser'),
        request.withHeaders({ 'Content-Type': ContentType.APPLICATION_JSON }),
        request.withBody(body),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(body);
    });

    test(`parses ${ContentType.APPLICATION_X_WWW_FORM_URLENCODED} content-type`, async () => {
      const { request } = await testBedSetup.useTestBed();
      const body = { id: 'id', name: 'name', age: '100' };

      const response = await pipe(
        request('POST'),
        request.withPath('/default-parser'),
        request.withHeaders({ 'Content-Type': ContentType.APPLICATION_X_WWW_FORM_URLENCODED }),
        request.withBody(body),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(body);
    });
  });

  describe('multiple parsers', () => {
    test(`parses ${ContentType.APPLICATION_JSON} content-type`, async () => {
      const { request } = await testBedSetup.useTestBed();
      const body = { id: 'id', name: 'name', age: 100 };

      const response = await pipe(
        request('POST'),
        request.withPath('/multiple-parsers'),
        request.withHeaders({ 'Content-Type': ContentType.APPLICATION_JSON }),
        request.withBody(body),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(body);
    });

    test('parses custom "test/json" content-type', async () => {
      const { request } = await testBedSetup.useTestBed();
      const body = { id: 'id', name: 'name', age: 100 };

      const response = await pipe(
        request('POST'),
        request.withPath('/multiple-parsers'),
        request.withHeaders({ 'Content-Type': 'test/json' }),
        request.withBody(body),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(body);
    });

    test(`parses ${ContentType.APPLICATION_VND_API_JSON} content-type`, async () => {
      const { request } = await testBedSetup.useTestBed();
      const body = { id: 'id', name: 'name', age: 100 };

      const response = await pipe(
        request('POST'),
        request.withPath('/multiple-parsers'),
        request.withHeaders({ 'Content-Type': ContentType.APPLICATION_VND_API_JSON }),
        request.withBody(body),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(body);
    });

    test(`parses ${ContentType.TEXT_PLAIN} content-type`, async () => {
      const { request } = await testBedSetup.useTestBed();
      const body = 'test message';

      const response = await pipe(
        request('POST'),
        request.withPath('/multiple-parsers'),
        request.withHeaders({ 'Content-Type': ContentType.TEXT_PLAIN }),
        request.withBody(body),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(body);
    });

    test(`parses ${ContentType.APPLICATION_OCTET_STREAM} content-type`, async () => {
      const { request } = await testBedSetup.useTestBed();
      const body = { id: 'id', name: 'name', age: 100 };

      const response = await pipe(
        request('POST'),
        request.withPath('/multiple-parsers'),
        request.withHeaders({ 'Content-Type': ContentType.APPLICATION_OCTET_STREAM }),
        request.withBody(body),
        request.send,
      );

      expect(response.statusCode).toEqual(200);
      expect(response.body).toEqual(pipe(body, stringifyJson, bufferFrom));
    });
  });
});
