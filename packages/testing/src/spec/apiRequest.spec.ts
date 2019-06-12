import { createMarble } from './server.spec-setup';
import { createTestApi, TestApi } from '../testApi';

describe('@marblejs/testing - ApiRequest', () => {
  let testApi: TestApi;

  beforeAll(() => {
    const httpListener = createMarble();
    testApi = createTestApi({ httpListener });
  });

  afterAll(() => {
    if (testApi) {
      testApi.finish();
    }
  });

  test('accumulates headers', () => {
    const { request } = testApi.get('/')
      .withHeader('x-test', 'value')
      .withHeaders({ 'x-test-2': 'value2' })
      .withHeader('x-test-3', 'value3');
    expect(request.headers).toEqual({
      'x-test': 'value',
      'x-test-2': 'value2',
      'x-test-3': 'value3',
    });
  });

  test('overrides headers - last header with the same name is valid', () => {
    const { request } = testApi.get('/')
      .withHeader('x-test', 'value')
      .withHeaders({ 'x-test': 'value2' });
    expect(request.headers).toEqual({
      'x-test': 'value2',
    });
  });

  test('adds JSON body and does not override a Content-Type header if it already exists', () => {
    const { request } = testApi.post('/')
      .withHeader('Content-Type', 'application/vnd.api+json')
      .withBody({});
    expect(request.headers).toEqual({
      'Content-Type': 'application/vnd.api+json',
    });
  });

  test('adds non-JSON body', () => {
    const { request } = testApi.post('/')
      .withBody('test');
    expect(request.body).toEqual('test');
  });

  test('sets protocol', () => {
    const { request } = testApi.get('/')
      .withProtocol('wtf:');
    expect(request.protocol).toBe('wtf:');
  });

  test('sets host', () => {
    const { request } = testApi.get('/')
      .withHost('example.com');
    expect(request.host).toBe('example.com');
  });
});
