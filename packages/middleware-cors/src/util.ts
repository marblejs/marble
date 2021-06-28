import * as http from 'http';
import { createEffectContext, createContext, lookup } from '@marblejs/core';
import { HttpMethod } from '@marblejs/http';
import { createHttpRequest } from '@marblejs/http/dist/+internal/testing.util';

export const capitalize = (str: string): string =>
  str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');

export const isString = (str: any): boolean =>
  typeof str === 'string' || str instanceof String;

export const createMockRequest = (
  method: HttpMethod = 'GET',
  headers: any = { origin: 'fake-origin' },
) => createHttpRequest({ method, headers });

export const createMockEffectContext = () => {
  const context = createContext();
  const client = http.createServer();
  return createEffectContext({ ask: lookup(context), client });
};
