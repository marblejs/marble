import { cors$ as corsMiddleware$ } from '@marblejs/middleware-cors';

export const cors$ = corsMiddleware$({
  origin: '*',
  methods: ['HEAD', 'GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  optionsSuccessStatus: 204,
  allowHeaders: ['Authorization', 'X-Header'],
  withCredentials: true,
  maxAge: 36000,
});
