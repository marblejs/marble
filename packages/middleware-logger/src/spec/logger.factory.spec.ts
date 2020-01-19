import { createHttpResponse, createHttpRequest } from '@marblejs/core/dist/+internal/testing';
import { factorizeLog } from '../logger.factory';

describe('Logger factory', () => {
  let loggerUtilModule;

  beforeEach(() => {
    jest.unmock('../logger.util.ts');
    loggerUtilModule = require('../logger.util.ts');
  });

  test('#factorizeLog factorizes logger message', () => {
    // given
    const response = createHttpResponse({ statusCode: 200 });
    const req = createHttpRequest({ method: 'GET', url: '/api/v1', response });
    const stamp = { value: req, timestamp: 1539031930521 };

    // when
    loggerUtilModule.factorizeTime = jest.fn(() => '+300ms');
    const log = factorizeLog(stamp)(req);

    // then
    expect(log).toEqual('GET /api/v1 200 +300ms');
  });

});
