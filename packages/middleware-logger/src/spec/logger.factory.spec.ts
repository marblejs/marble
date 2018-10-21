import { HttpResponse, HttpRequest } from '@marblejs/core';
import { prepareLogString, factorizeLog } from '../logger.factory';

describe('Logger factory', () => {
  let loggerFactoryModule;
  let loggerUtilModule;

  beforeEach(() => {
    jest.unmock('../logger.factory.ts');
    loggerFactoryModule = require('../logger.factory.ts');

    jest.unmock('../logger.util.ts');
    loggerUtilModule = require('../logger.util.ts');
  });

  test('#prepareLogString stringifies log with timestamp', () => {
    // given
    const opts = {
      timestamp: new Date().toISOString(),
      method: 'GET',
      url: '/api/v1',
      statusCode: '200',
      time: '300ms',
    };

    // when
    const preparedLog = prepareLogString(opts);

    // then
    expect(preparedLog).toEqual(`${opts.timestamp} GET /api/v1 200 300ms`);
  });

  test('#prepareLogString stringifies log without timestamp', () => {
    // given
    const opts = {
      method: 'GET',
      url: '/api/v1',
      statusCode: '200',
      time: '300ms',
    };

    // when
    const preparedLog = prepareLogString(opts);

    // then
    expect(preparedLog).toEqual(`GET /api/v1 200 300ms`);
  });

  test('#factorizeLog factorizes logger message', () => {
    // given
    const res = { statusCode: 200 } as HttpResponse;
    const req = { method: 'GET', url: '/api/v1' } as HttpRequest;
    const stamp = { value: req, timestamp: 1539031930521 };
    const opts = { colorize: false, timestamp: true };
    const date = 1540145853 * 1000;

    // when
    loggerFactoryModule.prepareLogString = jest.fn();
    loggerUtilModule.factorizeTime = jest.fn(() => '300ms');
    spyOn(Date, 'now').and.returnValue(date);
    factorizeLog(res, stamp)(opts);

    // then
    expect(loggerFactoryModule.prepareLogString).toHaveBeenCalledWith({
      method: 'GET',
      url: '/api/v1',
      statusCode: '200',
      time: '300ms',
      timestamp: '2018-10-21T18:17:33.000Z',
    });
  });
});
