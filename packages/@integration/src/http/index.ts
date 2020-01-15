import { createServer } from '@marblejs/core';
import httpListener from './http.listener';

const port = process.env.PORT
  ? Number(process.env.PORT)
  : undefined;

export const server = createServer({
  port,
  httpListener,
});

export const bootstrap = async () => {
  const app = await server;

  if (process.env.NODE_ENV !== 'test') app();
};

bootstrap();
