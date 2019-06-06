<p align="center">
  <a href="https://marblejs.com">
    <img src="https://github.com/marblejs/marble/blob/master/assets/img/logo.png?raw=true" width="200" alt="Marble.js logo"/>
  </a>
</p>

# @marblejs/testing

Testing proxy and OpenAPI v3 documentation generator for [Marble.js](https://github.com/marblejs/marble).

## Installation

```
$ npm i @marblejs/testing
```
Requires `@marblejs/core` to be installed.

## Documentation

For the latest updates, documentation, change log, and release information visit [docs.marblejs.com](https://docs.marblejs.com) and follow [@marble_js](https://twitter.com/marble_js) on Twitter.

## Usage

```typescript
import { createTestApi, ApiCollection, ApiDocument } from '@marblejs/testing';
import { httpListener } from './app/';

// Configure TestApi that will call the app across all tests
export const testApi = createTestApi({
  httpListener,
}).useHeaders({
  'Content-Type': 'application/json',
});

// Define documentation base
export const peopleCollection = new ApiCollection('People');
export const notesCollection = new ApiCollection('Notes');
export const doc = new ApiDocument('Test API', '0.1.0')
  .useServers([
    { url: 'https://example.marblejs.com/api/v1', description: 'Production environment' },
    { url: 'https://example.staging.marblejs.com/api/v1', description: 'Staging environment' },
  ])
  .add(peopleCollection)
  .add(notesCollection);


// In tests, call endpoints:
test('gets Cathy from /people/:name endpoint', async () =>{
  const response = await testApi.get('/people/cathy')
    .send();
  response.collect(peopleCollection);
  expect(response.responseBody).toEqual({...});
  expect(response.succeeded).toBe(true);
});

test('gets 404 when  Cathy from /people/:name endpoint', async () =>{
  const response = await testApi.get('/people/john')
    .send();
  response.collect(peopleCollection);
  expect(response.status).toBe(404);
});

test('posts to /notes endpoint', async () => {
  const response = await testApi.post('/notes')
    .withBody({
      author: 'Cathy',
      date: '2019-06-11T09:30:00.000Z',
      note: 'This is a sample note.'
    })
    .send();
  response.collect(notesCollection);
  expect(response.responseHeaders).toEqual({...});
});


// When all tests finish, shutfown testApi and save the documentation to file
afterAll(() => {
  testApi.finish();
  const openApiDoc = doc.generate();
  fs.writeFileSync('./swagger.json', openApiDoc);
});

```

License: MIT
