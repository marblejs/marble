import { createServer, Server } from 'http';
import { closeServer, getServerAddress } from './server.util';

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
