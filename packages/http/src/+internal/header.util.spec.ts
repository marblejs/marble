import { createServer, Server } from 'http';
import * as O from 'fp-ts/lib/Option';
import { getHeaderValue, normalizeHeaders } from './header.util';
import { closeServer, getServerAddress } from './server.util';
import { createHttpRequest } from './testing.util';

test('#getHeaderValue', () => {
  const req = createHttpRequest({
    headers: {
      'x-test-1': 'a',
      'x-test-2': ['b', 'c'],
    }
  });

  expect(getHeaderValue('x-test-1')(req.headers)).toEqual(O.some('a'));
  expect(getHeaderValue('x-test-2')(req.headers)).toEqual(O.some('b'));
  expect(getHeaderValue('x-test-3')(req.headers)).toEqual(O.none);
});

test('#getServerAddress', async () => {
  const server = await new Promise<Server>(res => {
    const server = createServer();
    server.listen(() => res(server));
  });

  expect(getServerAddress(server)).toEqual({
    port: expect.any(Number),
    host: '127.0.0.1',
  });

  await closeServer(server)();
});

test('#normalizeHeaders', () => {
  expect(normalizeHeaders({
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ABC123',
    'x-test-1': 'test-123',
  })).toEqual({
    'content-type': 'application/json',
    'authorization': 'Bearer ABC123',
    'x-test-1': 'test-123',
  });
});
