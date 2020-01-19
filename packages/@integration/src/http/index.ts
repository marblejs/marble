import { IO } from 'fp-ts/lib/IO';
import { createServer } from '@marblejs/core';
import { isTestEnv } from '@marblejs/core/dist/+internal/utils';
import httpListener from './http.listener';

const port = process.env.PORT
  ? Number(process.env.PORT)
  : undefined;

export const server = createServer({
  port,
  httpListener,
});

const main: IO<void> = async () =>
  !isTestEnv() && await (await server)();

main();
