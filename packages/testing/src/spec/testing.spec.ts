import { createMarble } from './server.spec-setup';
import { ApiCollection, createTestApi, Endpoint } from '../';
import { HttpMethodType, HttpStatus } from '@marblejs/core';
import { ApiDocument } from '../apiDocument';
import OpenAPIValidator from 'openapi-schema-validator';

describe('@marblejs/testing - TestApi', () => {
  const httpListener = createMarble();

  test('starts and finished correctly', async () => {
    const testApi = createTestApi({
      httpListener,
    });
    testApi.finish();
  });

  test('returns response with pre-parsed body from server', async () => {
    const testApi = createTestApi({
      httpListener,
    });
    const response = await testApi.get('/people/cathy')
      .send();

    expect(response.path).toBe('/people/:name');
    expect(response.method).toBe('GET');
    expect(response.failed).toBe(false);
    expect(response.succeeded).toBe(true);
    expect(response.status).toBe(HttpStatus.OK);
    expect(response.responseBody).toEqual({
      firstName: 'Cathy',
      lastName: 'Scott',
      email: 'cathy.scott98@example.com',
      birthday: '8/6/1978',
      address: '2059 W Craig Rd',
      phone: '(700)-354-2326',
    });
    expect(response.responseHeaders).toMatchObject({
      'content-type': ['application/json'],
    });

    testApi.finish();
  });

  test('has all basic request methods', () => {
    const testApi = createTestApi({
      httpListener,
    });
    testApi.finish();

    // Contains all HTTP methods supported by Marble.js (without *)
    const methods = Object.keys(HttpMethodType)
      .filter(method => isNaN(parseInt(method)) && method !== '*')
      .map(method => method.toLowerCase());

    for (const method of methods) {
      try {
        expect(() => testApi[method]('/')).not.toThrow();
      } catch {
        throw new Error(`Method ${method} does not exist`);
      }
    }
  });

  test('stores request in collection', async () => {
    const testApi = createTestApi({
      httpListener,
    }).useHeaders({
      'Content-Type': 'application/json',
    });
    const collection = new ApiCollection('API');

    const responseOk = await testApi.get('/people/cathy')
      .send();
    responseOk.collect(collection);
    const responseNotFound = await testApi.get('/people/john')
      .send();
    responseNotFound.collect(collection);

    testApi.finish();

    expect(collection.endpoints).toEqual([
      {
        path: '/people/:name',
        method: 'GET',
        responses: [responseOk, responseNotFound],
      } as Endpoint
    ]);
  });

  test('generates valid OpenAPI 3 documentation based on test requests', async () => {
    const testApi = createTestApi({
      httpListener,
    })
      .useHeaders({
        'Content-Type': 'application/json',
      });

    const peopleCollection = new ApiCollection('People');
    const notesCollection = new ApiCollection('Notes');
    const doc = new ApiDocument('Test API', '0.1.0')
      .useServers([
        { url: 'https://example.marblejs.com/api/v1', description: 'Production environment' },
        { url: 'https://example.staging.marblejs.com/api/v1', description: 'Staging environment' },
      ])
      .add(peopleCollection)
      .add(notesCollection);

    (
      await testApi.get('/people/cathy')
        .send()
    ).collect(peopleCollection);
    (
      await testApi.get('/people/john')
        .send()
    ).collect(peopleCollection);
    (
      await testApi.post('/notes')
        .withBody({
          author: 'Cathy',
          date: '2019-06-11T09:30:00.000Z',
          note: 'This is a sample note.'
        })
        .send()
    ).collect(notesCollection);

    testApi.finish();

    const openApiDoc = doc.generate();

    const validator = new OpenAPIValidator({
      version: '3.0',
    });
    expect(validator.validate(openApiDoc).errors).toEqual([]);
  });
});
