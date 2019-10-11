import { HttpResponse, HttpMethod, HttpRequest, createEffectContext, createContext, lookup } from '@marblejs/core';

export const capitalize = (str: string): string =>
  str
    .split('-')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join('-');

export const isString = (str: any): boolean =>
  typeof str === 'string' || str instanceof String;


export const createMockResponse = () => (({
  writeHead: jest.fn(),
  setHeader: jest.fn(),
  getHeader: jest.fn(),
  end: jest.fn(),
} as unknown) as HttpResponse);

export const createMockRequest = (
  method: HttpMethod = 'GET',
  headers: any = { origin: 'fake-origin' },
) => (({
  method,
  headers: { ...headers },
} as unknown) as HttpRequest);

export const createMockEffectContext = () => {
  const context = createContext();
  const client = createMockResponse();
  return createEffectContext({ ask: lookup(context), client });
};
