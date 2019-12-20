import { WriteStream } from 'fs';
import { Timestamp } from 'rxjs';
import { HttpRequest } from '@marblejs/core';
import { createHttpRequest } from '@marblejs/core/dist/+internal';
import { loggerHandler } from '../logger.handler';
import { LoggerOptions } from '../logger.model';

describe('#loggerHandler', () => {
  let loggerUtil;
  let loggerFactory;

  beforeEach(() => {
    jest.unmock('../logger.util.ts');
    loggerUtil = require('../logger.util.ts');

    jest.unmock('../logger.factory.ts');
    loggerFactory = require('../logger.factory.ts');
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  test('writes log to provided stream', () => {
    // given
    const req = createHttpRequest();
    const stream = {} as WriteStream;
    const opts = { silent: false, stream } as LoggerOptions;
    const stamp = { value: req, timestamp: 0 } as Timestamp<HttpRequest>;
    const expectedLog = 'test_log';

    // when
    loggerUtil.writeToStream = jest.fn();
    loggerFactory.factorizeLog = jest.fn(() => () => expectedLog);
    loggerHandler(opts)(stamp);
    req.response.emit('finish');

    // then
    expect(loggerUtil.writeToStream).toHaveBeenCalledWith(stream, expectedLog);
  });

  test('writes log to console.info', () => {
    // given
    const req = createHttpRequest();
    const opts = { silent: false };
    const stamp = { value: req, timestamp: 0 } as Timestamp<HttpRequest>;
    const expectedLog = 'test_log';

    // when
    jest.spyOn(console, 'info').mockImplementation(jest.fn());
    loggerUtil.writeToStream = jest.fn();
    loggerFactory.factorizeLog = jest.fn(() => () => expectedLog);
    loggerHandler(opts)(stamp);
    req.response.emit('finish');

    // then
    expect(console.info).toHaveBeenCalledWith(expectedLog);
  });
});
